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
        $query = Pet::with(['owner.userAuth', 'photos']);

        // Filter by species (pet type)
        if ($request->filled('pet_type')) {
            $query->where('species', $request->pet_type);
        }

        // Filter by breed
        if ($request->filled('breed')) {
            $query->where('breed', 'like', '%' . $request->breed . '%');
        }

        // Filter by sex
        if ($request->filled('sex')) {
            $query->where('sex', $request->sex);
        }

        // Filter by verification status (owner's verification status)
        if ($request->filled('verification_status')) {
            $query->whereHas('owner.userAuth', function ($q) use ($request) {
                $q->where('status', $request->verification_status);
            });
        }

        // Filter by activity status (pet status)
        if ($request->filled('activity_status')) {
            $query->where('status', $request->activity_status);
        }

        // Search by name or ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('pet_id', 'like', "%{$search}%");
            });
        }

        $pets = $query->paginate(10)->appends($request->query());

        return view('admin.pets.index', compact('pets'));
    }

    /**
     * Display pet details page.
     */
    public function petDetails($petId)
    {
        $pet = Pet::with([
            'owner.userAuth',
            'photos',
            'vaccinations',
            'healthRecords',
            'littersAsSire.dam',
            'littersAsSire.offspring',
            'littersAsDam.sire',
            'littersAsDam.offspring',
            'offspringRecord.litter'
        ])->findOrFail($petId);

        // Get all litters (as sire or dam) with partner information
        $litters = collect();

        if ($pet->sex === 'male') {
            $litters = $pet->littersAsSire()
                ->with(['dam', 'offspring'])
                ->orderBy('birth_date', 'desc')
                ->get();
        } else {
            $litters = $pet->littersAsDam()
                ->with(['sire', 'offspring'])
                ->orderBy('birth_date', 'desc')
                ->get();
        }

        return view('admin.pets.show', compact('pet', 'litters'));
    }

    /**
     * Update pet status.
     */
    public function updatePetStatus(Request $request, $petId)
    {
        $request->validate([
            'status' => 'required|in:active,disabled,cooldown,banned',
        ]);

        $pet = Pet::findOrFail($petId);
        $pet->status = $request->status;
        $pet->save();

        return redirect()->route('admin.pets.details', $petId)
            ->with('success', 'Pet status updated successfully.');
    }

    /**
     * Delete a pet.
     */
    public function deletePet($petId)
    {
        $pet = Pet::findOrFail($petId);
        $pet->delete();

        return redirect()->route('admin.pets.index')
            ->with('success', 'Pet deleted successfully.');
    }

    /**
     * Update vaccination status (approve/reject).
     */
    public function updateVaccinationStatus(Request $request, $vaccinationId)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|max:500',
        ]);

        $vaccination = \App\Models\Vaccination::findOrFail($vaccinationId);
        $vaccination->status = $request->status;

        if ($request->status === 'rejected' && $request->rejection_reason) {
            $vaccination->rejection_reason = $request->rejection_reason;
        }

        $vaccination->save();

        $message = $request->status === 'approved'
            ? 'Vaccination approved successfully.'
            : 'Vaccination rejected successfully.';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Update health record status (approve/reject).
     */
    public function updateHealthRecordStatus(Request $request, $healthRecordId)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|max:500',
        ]);

        $healthRecord = \App\Models\HealthRecord::findOrFail($healthRecordId);
        $healthRecord->status = $request->status;

        if ($request->status === 'rejected' && $request->rejection_reason) {
            $healthRecord->rejection_reason = $request->rejection_reason;
        }

        $healthRecord->save();

        $message = $request->status === 'approved'
            ? 'Health certificate approved successfully.'
            : 'Health certificate rejected successfully.';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Display litter details page.
     */
    public function litterDetails($litterId)
    {
        $litter = \App\Models\Litter::with([
            'sire',
            'dam',
            'sireOwner',
            'damOwner',
            'offspring'
        ])->findOrFail($litterId);

        return view('admin.litters.show', compact('litter'));
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
