<?php

namespace App\Http\Controllers;

use App\Models\SafetyReport;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;

class SafetyController extends Controller
{
    /**
     * Block a user
     */
    public function blockUser(Request $request, $userId)
    {
        try {
            $user = $request->user();
            $userToBlock = User::findOrFail($userId);

            if ($user->id === $userToBlock->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot block yourself',
                ], 400);
            }

            if ($user->hasBlocked($userToBlock)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already blocked',
                ], 400);
            }

            UserBlock::create([
                'blocker_id' => $user->id,
                'blocked_id' => $userToBlock->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'User blocked successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to block user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unblock a user
     */
    public function unblockUser(Request $request, $userId)
    {
        try {
            $user = $request->user();

            $deleted = UserBlock::where('blocker_id', $user->id)
                ->where('blocked_id', $userId)
                ->delete();

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not blocked',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'User unblocked successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unblock user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get list of blocked users
     */
    public function getBlockedUsers(Request $request)
    {
        try {
            $user = $request->user();

            $blockedUsers = $user->blockedUsers()
                ->select('users.id', 'users.name', 'users.profile_image')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $blockedUsers,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get blocked users',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if a user is blocked
     */
    public function isBlocked(Request $request, $userId)
    {
        try {
            $user = $request->user();
            $targetUser = User::findOrFail($userId);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_blocked' => $user->hasBlocked($targetUser),
                    'is_blocked_by' => $user->isBlockedBy($targetUser),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check block status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Report a user
     */
    public function reportUser(Request $request, $userId)
    {
        try {
            $request->validate([
                'reason' => 'required|string|in:' . implode(',', SafetyReport::getValidReasons()),
                'description' => 'nullable|string|max:1000',
            ]);

            $user = $request->user();
            $userToReport = User::findOrFail($userId);

            if ($user->id === $userToReport->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot report yourself',
                ], 400);
            }

            // Check for existing pending report
            $existingReport = SafetyReport::where('reporter_id', $user->id)
                ->where('reported_id', $userToReport->id)
                ->where('status', SafetyReport::STATUS_PENDING)
                ->first();

            if ($existingReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending report for this user',
                ], 400);
            }

            $report = SafetyReport::create([
                'reporter_id' => $user->id,
                'reported_id' => $userToReport->id,
                'reason' => $request->reason,
                'description' => $request->description,
                'status' => SafetyReport::STATUS_PENDING,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report submitted successfully',
                'data' => $report,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get report reasons
     */
    public function getReportReasons()
    {
        $reasons = SafetyReport::getReasonLabels();

        $data = array_map(function ($value, $label) {
            return ['value' => $value, 'label' => $label];
        }, array_keys($reasons), array_values($reasons));

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
