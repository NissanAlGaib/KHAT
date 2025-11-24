<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    /**
     * Display the admin login form.
     */
    public function showLoginForm()
    {
        return view('admin.login');
    }

    /**
     * Handle admin login request.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->filled('remember');

        if (Auth::attempt($credentials, $remember)) {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // Check if user has admin role
            if ($user->roles()->where('role_type', 'admin')->exists()) {
                $request->session()->regenerate();
                return redirect()->intended('/admin/dashboard');
            }

            // If not admin, logout and show error
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['You do not have admin access.'],
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['The provided credentials do not match our records.'],
        ]);
    }

    /**
     * Display the admin dashboard.
     */
    public function dashboard()
    {
        return view('admin.dashboard');
    }

    /**
     * Handle admin logout.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/login');
    }

    /**
     * Display user management page.
     */
    public function usersIndex(Request $request)
    {
        $status = $request->get('status', 'verified');

        $query = User::with('roles');

        // Filter by verification status
        if ($status === 'pending') {
            $query->whereHas('userAuth', function ($q) {
                $q->where('status', 'pending');
            });
        } elseif ($status === 'rejected') {
            $query->whereHas('userAuth', function ($q) {
                $q->where('status', 'rejected');
            });
        } elseif ($status === 'verified') {
            $query->whereHas('userAuth', function ($q) {
                $q->where('status', 'approved');
            });
        }

        // Filter by user type (role)
        if ($request->filled('user_type')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('role_type', $request->user_type);
            });
        }

        // Filter by subscription tier
        if ($request->filled('subscription')) {
            $query->where('subscription_tier', $request->subscription);
        }

        // Search by name or ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(15);

        return view('admin.users.index', compact('users', 'status'));
    }

    /**
     * Display pet management page.
     */
    public function petsIndex(Request $request)
    {
        $status = $request->get('status', 'active');

        $query = Pet::with(['owner', 'photos']);

        // Filter by pet status
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $pets = $query->paginate(15);

        return view('admin.pets.index', compact('pets', 'status'));
    }

    /**
     * Display match history page.
     */
    public function matchHistory()
    {
        return view('admin.match-history');
    }

    /**
     * Display analytics page.
     */
    public function analytics()
    {
        return view('admin.analytics');
    }

    /**
     * Display billing page.
     */
    public function billing()
    {
        return view('admin.billing');
    }

    /**
     * Display tickets page.
     */
    public function tickets()
    {
        return view('admin.tickets');
    }

    /**
     * Display audit logs page.
     */
    public function auditLogs()
    {
        return view('admin.audit-logs');
    }

    /**
     * Display profile settings page.
     */
    public function profile()
    {
        return view('admin.profile');
    }

    /**
     * Display notifications page.
     */
    public function notifications()
    {
        return view('admin.notifications');
    }

    /**
     * Display settings page.
     */
    public function settings()
    {
        return view('admin.settings');
    }

    /**
     * Get user details for verification modal
     */
    public function getUserDetails($userId)
    {
        $user = User::with(['roles', 'userAuth'])->findOrFail($userId);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at->format('M d, Y'),
                'roles' => $user->roles->pluck('role_type'),
                'documents' => $user->userAuth->map(function ($auth) {
                    $expiryDate = $auth->expiry_date;
                    $daysRemaining = null;

                    if ($expiryDate) {
                        $now = \Carbon\Carbon::now();
                        $expiry = \Carbon\Carbon::parse($expiryDate);
                        $daysRemaining = $now->diffInDays($expiry, false);
                    }

                    return [
                        'auth_id' => $auth->auth_id,
                        'auth_type' => $auth->auth_type,
                        'document_path' => $auth->document_path ? asset('storage/' . $auth->document_path) : null,
                        'status' => $auth->status,
                        'date_created' => $auth->date_created->format('M d, Y'),
                        'date_submitted' => $auth->created_at->format('M d, Y h:i A'),
                        'updated_at' => $auth->updated_at->format('M d, Y'),
                        'expiry_date' => $expiryDate ? \Carbon\Carbon::parse($expiryDate)->format('M d, Y') : null,
                        'days_remaining' => $daysRemaining,
                    ];
                })
            ]
        ]);
    }

    /**
     * Update verification status
     */
    public function updateVerificationStatus(Request $request, $authId)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'reason' => 'nullable|string'
        ]);

        $userAuth = \App\Models\UserAuth::findOrFail($authId);
        $userAuth->status = $request->status;
        $userAuth->save();

        return response()->json([
            'success' => true,
            'message' => 'Verification status updated successfully'
        ]);
    }

    /**
     * Delete user account
     */
    public function deleteUser($userId)
    {
        $user = User::findOrFail($userId);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User account deleted successfully'
        ]);
    }
}
