<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserAuth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class VerificationController extends Controller
{
    /**
     * Submit verification documents
     */
    public function submitVerification(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'id_document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
                'breeder_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
                'shooter_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
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
                $idPath = $request->file('id_document')->store('verification/id/' . $userId, 'public');
                $createdRecords[] = UserAuth::create([
                    'user_id' => $userId,
                    'auth_type' => 'id',
                    'document_path' => $idPath,
                    'status' => 'pending',
                ]);
            }

            // Store and create record for breeder document if provided
            if ($request->hasFile('breeder_document')) {
                $breederPath = $request->file('breeder_document')->store('verification/breeder/' . $userId, 'public');
                $createdRecords[] = UserAuth::create([
                    'user_id' => $userId,
                    'auth_type' => 'breeder_certificate',
                    'document_path' => $breederPath,
                    'status' => 'pending',
                ]);
            }

            // Store and create record for shooter document if provided
            if ($request->hasFile('shooter_document')) {
                $shooterPath = $request->file('shooter_document')->store('verification/shooter/' . $userId, 'public');
                $createdRecords[] = UserAuth::create([
                    'user_id' => $userId,
                    'auth_type' => 'shooter_certificate',
                    'document_path' => $shooterPath,
                    'status' => 'pending',
                ]);
            }

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
}
