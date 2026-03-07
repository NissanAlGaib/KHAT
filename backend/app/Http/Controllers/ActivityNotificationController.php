<?php

namespace App\Http\Controllers;

use App\Models\ActivityNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ActivityNotificationController extends Controller
{
    /**
     * List activity notifications for the authenticated user.
     * Supports pagination, type filtering, and read/unread filtering.
     */
    public function index(Request $request)
    {
        try {
            $userId = Auth::id();
            $perPage = $request->input('per_page', 20);
            $type = $request->input('type'); // optional type filter
            $status = $request->input('status'); // 'read' | 'unread' | null (all)

            $query = ActivityNotification::forUser($userId)
                ->orderBy('created_at', 'desc');

            if ($type) {
                $query->ofType($type);
            }

            if ($status === 'unread') {
                $query->unread();
            } elseif ($status === 'read') {
                $query->read();
            }

            $notifications = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch activity notifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
            ], 500);
        }
    }

    /**
     * Get the count of unread notifications.
     */
    public function unreadCount()
    {
        try {
            $userId = Auth::id();
            $count = ActivityNotification::forUser($userId)->unread()->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'count' => $count,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get unread count: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get unread count',
            ], 500);
        }
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead($id)
    {
        try {
            $userId = Auth::id();
            $notification = ActivityNotification::forUser($userId)->findOrFail($id);
            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read',
            ], 500);
        }
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    public function markAllAsRead()
    {
        try {
            $userId = Auth::id();
            $updated = ActivityNotification::forUser($userId)
                ->unread()
                ->update(['read_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => "{$updated} notifications marked as read",
                'data' => [
                    'updated_count' => $updated,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all as read',
            ], 500);
        }
    }
}
