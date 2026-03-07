<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserAuth;
use App\Models\Pet;
use App\Models\Vaccination;
use App\Models\HealthRecord;
use App\Models\SafetyReport;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     * This includes user verification documents and pet verification documents
     */
    public function getNotifications(Request $request)
    {
        try {
            $userId = Auth::id();
            $notifications = [];

            // Get user verification status (ID, breeder, shooter certificates)
            $userVerifications = UserAuth::where('user_id', $userId)
                ->whereIn('status', ['pending', 'approved', 'rejected'])
                ->orderBy('updated_at', 'desc')
                ->get();

            foreach ($userVerifications as $verification) {
                $notifications[] = [
                    'id' => 'user_auth_' . $verification->auth_id,
                    'type' => 'user_verification',
                    'auth_id' => $verification->auth_id,
                    'auth_type' => $verification->auth_type,
                    'document_type' => $this->getDocumentTypeLabel($verification->auth_type),
                    'status' => $verification->status,
                    'rejection_reason' => $verification->rejection_reason,
                    'created_at' => $verification->date_created,
                    'updated_at' => $verification->updated_at,
                    'message' => $this->getUserVerificationMessage($verification),
                ];
            }

            // Get pet verifications (vaccinations and health records)
            $pets = Pet::where('user_id', $userId)->get();

            foreach ($pets as $pet) {
                // Get vaccination statuses
                $vaccinations = Vaccination::where('pet_id', $pet->pet_id)
                    ->whereIn('status', ['pending', 'approved', 'rejected'])
                    ->orderBy('updated_at', 'desc')
                    ->get();

                foreach ($vaccinations as $vaccination) {
                    $notifications[] = [
                        'id' => 'vaccination_' . $vaccination->vaccination_id,
                        'type' => 'pet_vaccination',
                        'vaccination_id' => $vaccination->vaccination_id,
                        'pet_id' => $pet->pet_id,
                        'pet_name' => $pet->name,
                        'vaccine_name' => $vaccination->vaccine_name,
                        'status' => $vaccination->status,
                        'rejection_reason' => $vaccination->rejection_reason,
                        'created_at' => $vaccination->created_at,
                        'updated_at' => $vaccination->updated_at,
                        'message' => $this->getPetVaccinationMessage($pet, $vaccination),
                    ];
                }

                // Get health record statuses
                $healthRecords = HealthRecord::where('pet_id', $pet->pet_id)
                    ->whereIn('status', ['pending', 'approved', 'rejected'])
                    ->orderBy('updated_at', 'desc')
                    ->get();

                foreach ($healthRecords as $record) {
                    $notifications[] = [
                        'id' => 'health_record_' . $record->health_record_id,
                        'type' => 'pet_health_record',
                        'health_record_id' => $record->health_record_id,
                        'pet_id' => $pet->pet_id,
                        'pet_name' => $pet->name,
                        'record_type' => $record->record_type,
                        'status' => $record->status,
                        'rejection_reason' => $record->rejection_reason,
                        'created_at' => $record->created_at,
                        'updated_at' => $record->updated_at,
                        'message' => $this->getPetHealthRecordMessage($pet, $record),
                    ];
                }
            }

            // Get admin warnings from UserWarning model (direct warnings)
            $directWarnings = \App\Models\UserWarning::where('user_id', $userId)
                ->whereNull('acknowledged_at')
                ->orderBy('created_at', 'desc')
                ->get();

            foreach ($directWarnings as $warning) {
                $notifications[] = [
                    'id' => 'user_warning_' . $warning->id,
                    'type' => 'user_warning',
                    'status' => 'warning',
                    'warning_id' => $warning->id,
                    'reason' => $warning->type,
                    'reason_label' => $warning->type, // e.g. "Harassment"
                    'admin_notes' => $warning->message,
                    'created_at' => $warning->created_at,
                    'updated_at' => $warning->updated_at,
                    'message' => "Warning: {$warning->type}. {$warning->message}",
                ];
            }

            // Get admin warnings from safety reports (legacy/report-based)
            $adminWarnings = SafetyReport::where('reported_id', $userId)
                ->where('resolution_action', SafetyReport::ACTION_WARNING)
                ->whereIn('status', [SafetyReport::STATUS_REVIEWED, SafetyReport::STATUS_RESOLVED])
                ->orderBy('reviewed_at', 'desc')
                ->get();

            foreach ($adminWarnings as $warning) {
                $reasonLabel = SafetyReport::getReasonLabel($warning->reason);

                $notifications[] = [
                    'id' => 'admin_warning_' . $warning->id,
                    'type' => 'admin_warning',
                    'status' => 'warning',
                    'report_id' => $warning->id,
                    'reason' => $warning->reason,
                    'reason_label' => $reasonLabel,
                    'admin_notes' => $warning->admin_notes,
                    'created_at' => $warning->reviewed_at ?? $warning->updated_at,
                    'updated_at' => $warning->reviewed_at ?? $warning->updated_at,
                    'message' => "You have received a warning for {$reasonLabel}. Please review our community guidelines.",
                ];
            }

            // Sort all notifications by updated_at desc
            usort($notifications, function ($a, $b) {
                return strtotime($b['updated_at']) - strtotime($a['updated_at']);
            });

            // Count unread/actionable items
            $pendingCount = count(array_filter($notifications, fn($n) => $n['status'] === 'pending'));
            $rejectedCount = count(array_filter($notifications, fn($n) => $n['status'] === 'rejected'));
            $warningCount = count(array_filter($notifications, fn($n) => $n['status'] === 'warning'));

            return response()->json([
                'success' => true,
                'message' => 'Notifications retrieved successfully',
                'data' => [
                    'notifications' => $notifications,
                    'summary' => [
                        'total' => count($notifications),
                        'pending' => $pendingCount,
                        'rejected' => $rejectedCount,
                        'warnings' => $warningCount,
                        'approved' => count($notifications) - $pendingCount - $rejectedCount - $warningCount,
                    ]
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to get notifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification count for badge display
     */
    public function getNotificationCount(Request $request)
    {
        try {
            $userId = Auth::id();

            // Count rejected user verifications (needs action)
            $rejectedUserVerifications = UserAuth::where('user_id', $userId)
                ->where('status', 'rejected')
                ->count();

            // Count rejected pet verifications
            $pets = Pet::where('user_id', $userId)->pluck('pet_id');
            
            $rejectedVaccinations = Vaccination::whereIn('pet_id', $pets)
                ->where('status', 'rejected')
                ->count();

            $rejectedHealthRecords = HealthRecord::whereIn('pet_id', $pets)
                ->where('status', 'rejected')
                ->count();

            // Count admin warnings
            $warningCount = SafetyReport::where('reported_id', $userId)
                ->where('resolution_action', SafetyReport::ACTION_WARNING)
                ->whereIn('status', [SafetyReport::STATUS_REVIEWED, SafetyReport::STATUS_RESOLVED])
                ->count();

            $totalActionable = $rejectedUserVerifications + $rejectedVaccinations + $rejectedHealthRecords + $warningCount;

            return response()->json([
                'success' => true,
                'data' => [
                    'count' => $totalActionable,
                    'has_rejected' => ($rejectedUserVerifications + $rejectedVaccinations + $rejectedHealthRecords) > 0,
                    'has_warnings' => $warningCount > 0,
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to get notification count: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get notification count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper function to get document type label
     */
    private function getDocumentTypeLabel($authType)
    {
        $labels = [
            'id' => 'ID Verification',
            'breeder_certificate' => 'Breeder Certificate',
            'shooter_certificate' => 'Shooter Certificate',
        ];

        return $labels[$authType] ?? ucfirst(str_replace('_', ' ', $authType));
    }

    /**
     * Helper function to create user verification message
     */
    private function getUserVerificationMessage($verification)
    {
        $documentType = $this->getDocumentTypeLabel($verification->auth_type);

        switch ($verification->status) {
            case 'pending':
                return "Your {$documentType} is under review.";
            case 'approved':
                return "Your {$documentType} has been approved!";
            case 'rejected':
                return "Your {$documentType} has been rejected. Please resubmit.";
            default:
                return "Your {$documentType} status has been updated.";
        }
    }

    /**
     * Helper function to create pet vaccination message
     */
    private function getPetVaccinationMessage($pet, $vaccination)
    {
        switch ($vaccination->status) {
            case 'pending':
                return "{$pet->name}'s {$vaccination->vaccine_name} vaccination record is under review.";
            case 'approved':
                return "{$pet->name}'s {$vaccination->vaccine_name} vaccination record has been approved!";
            case 'rejected':
                return "{$pet->name}'s {$vaccination->vaccine_name} vaccination record has been rejected. Please resubmit.";
            default:
                return "{$pet->name}'s {$vaccination->vaccine_name} vaccination status has been updated.";
        }
    }

    /**
     * Helper function to create pet health record message
     */
    private function getPetHealthRecordMessage($pet, $record)
    {
        switch ($record->status) {
            case 'pending':
                return "{$pet->name}'s {$record->record_type} is under review.";
            case 'approved':
                return "{$pet->name}'s {$record->record_type} has been approved!";
            case 'rejected':
                return "{$pet->name}'s {$record->record_type} has been rejected. Please resubmit.";
            default:
                return "{$pet->name}'s {$record->record_type} status has been updated.";
        }
    }
}
