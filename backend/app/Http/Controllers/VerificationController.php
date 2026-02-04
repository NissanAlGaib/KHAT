<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserAuth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class VerificationController extends Controller
{
    /**
     * Submit verification documents
     */
    public function submitVerification(Request $request)
    {
        try {
            // Log what we're receiving
            Log::info('Verification submission received', [
                'has_id_document' => $request->hasFile('id_document'),
                'has_breeder_document' => $request->hasFile('breeder_document'),
                'has_shooter_document' => $request->hasFile('shooter_document'),
                'all_keys' => array_keys($request->all()),
                'file_keys' => array_keys($request->allFiles()),
            ]);

            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'id_document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
                'id_number' => 'nullable|string|max:255',
                'id_name' => 'nullable|string|max:255',
                'id_issue_date' => 'nullable|date',
                'id_expiration_date' => 'nullable|date',
                'breeder_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
                'breeder_number' => 'nullable|string|max:255',
                'breeder_name' => 'nullable|string|max:255',
                'breeder_issuing_authority' => 'nullable|string|max:255',
                'breeder_issue_date' => 'nullable|date',
                'breeder_expiration_date' => 'nullable|date',
                'shooter_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
                'shooter_number' => 'nullable|string|max:255',
                'shooter_name' => 'nullable|string|max:255',
                'shooter_issuing_authority' => 'nullable|string|max:255',
                'shooter_issue_date' => 'nullable|date',
                'shooter_expiration_date' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userId = $request->input('user_id');
            $createdRecords = [];

            // Store and create record for ID document
            if ($request->hasFile('id_document')) {
                $idPath = $request->file('id_document')->store('verification/id/' . $userId, 'do_spaces');
                $createdRecords[] = UserAuth::create([
                    'user_id' => $userId,
                    'auth_type' => 'id',
                    'document_path' => $idPath,
                    'document_number' => $request->input('id_number'),
                    'document_name' => $request->input('id_name'),
                    'issue_date' => $request->input('id_issue_date'),
                    'expiry_date' => $request->input('id_expiration_date'),
                    'status' => 'pending',
                ]);
            }

            // Store and create record for breeder document if provided
            if ($request->hasFile('breeder_document')) {
                $breederPath = $request->file('breeder_document')->store('verification/breeder/' . $userId, 'do_spaces');
                $createdRecords[] = UserAuth::create([
                    'user_id' => $userId,
                    'auth_type' => 'breeder_certificate',
                    'document_path' => $breederPath,
                    'document_number' => $request->input('breeder_number'),
                    'document_name' => $request->input('breeder_name'),
                    'issue_date' => $request->input('breeder_issue_date'),
                    'issuing_authority' => $request->input('breeder_issuing_authority'),
                    'expiry_date' => $request->input('breeder_expiration_date'),
                    'status' => 'pending',
                ]);
            }

            // Store and create record for shooter document if provided
            if ($request->hasFile('shooter_document')) {
                Log::info('Processing shooter document', [
                    'shooter_number' => $request->input('shooter_number'),
                    'shooter_name' => $request->input('shooter_name'),
                    'shooter_issuing_authority' => $request->input('shooter_issuing_authority'),
                ]);
                $shooterPath = $request->file('shooter_document')->store('verification/shooter/' . $userId, 'do_spaces');
                $createdRecords[] = UserAuth::create([
                    'user_id' => $userId,
                    'auth_type' => 'shooter_certificate',
                    'document_path' => $shooterPath,
                    'document_number' => $request->input('shooter_number'),
                    'document_name' => $request->input('shooter_name'),
                    'issue_date' => $request->input('shooter_issue_date'),
                    'issuing_authority' => $request->input('shooter_issuing_authority'),
                    'expiry_date' => $request->input('shooter_expiration_date'),
                    'status' => 'pending',
                ]);
                Log::info('Shooter document saved successfully', ['path' => $shooterPath]);
            }

            Log::info('Total records created: ' . count($createdRecords));

            return response()->json([
                'success' => true,
                'message' => 'Verification submitted successfully',
                'data' => $createdRecords
            ], 201);
        } catch (\Exception $e) {
            Log::error('Verification submission failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit verification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get verification status for a user
     */
    public function getVerificationStatus($userId)
    {
        try {
            $userAuth = UserAuth::where('user_id', $userId)
                ->orderBy('date_created', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Verification status retrieved',
                'data' => $userAuth
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to get verification status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get verification status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all pending verifications (admin only)
     */
    public function getPendingVerifications()
    {
        try {
            $pendingVerifications = UserAuth::where('status', 'pending')
                ->with('user:id,name,email')
                ->orderBy('date_created', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Pending verifications retrieved',
                'data' => $pendingVerifications
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to get pending verifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get pending verifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update verification status (admin only)
     */
    public function updateVerificationStatus(Request $request, $authId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:approved,rejected',
                'rejection_reason' => 'required_if:status,rejected|nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $userAuth = UserAuth::findOrFail($authId);
            $userAuth->status = $request->input('status');
            
            // Set rejection reason if status is rejected, clear it if approved
            if ($request->input('status') === 'rejected') {
                $userAuth->rejection_reason = $request->input('rejection_reason');
            } else {
                $userAuth->rejection_reason = null;
            }
            
            $userAuth->save();

            return response()->json([
                'success' => true,
                'message' => 'Verification status updated successfully',
                'data' => $userAuth
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to update verification status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update verification status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resubmit a user verification document
     */
    public function resubmitVerification(Request $request, $authId)
    {
        try {
            $userAuth = UserAuth::where('auth_id', $authId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
                'document_number' => 'nullable|string|max:255',
                'document_name' => 'nullable|string|max:255',
                'issue_date' => 'nullable|date',
                'expiration_date' => 'nullable|date',
                'issuing_authority' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Store the new document
            $folder = 'verification/' . $userAuth->auth_type . '/' . $userAuth->user_id;
            $documentPath = $request->file('document')->store($folder, 'do_spaces');

            // Update the verification record
            $userAuth->update([
                'document_path' => $documentPath,
                'document_number' => $request->input('document_number'),
                'document_name' => $request->input('document_name'),
                'issue_date' => $request->input('issue_date'),
                'expiry_date' => $request->input('expiration_date'),
                'issuing_authority' => $request->input('issuing_authority'),
                'status' => 'pending',
                'rejection_reason' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verification document resubmitted successfully',
                'data' => $userAuth
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to resubmit verification: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubmit verification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
