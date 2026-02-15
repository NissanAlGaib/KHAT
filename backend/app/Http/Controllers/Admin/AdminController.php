<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Pet;
use App\Models\MatchRequest;
use App\Models\BreedingContract;
use App\Models\Litter;
use App\Models\UserAuth;
use App\Models\AuditLog;
use App\Models\SafetyReport;
use App\Models\UserBlock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Calculate percentage growth between two values.
     *
     * @param int|float $current Current value
     * @param int|float $previous Previous value
     * @return float Growth percentage rounded to 1 decimal place
     */
    private function calculateGrowth(int|float $current, int|float $previous): float
    {
        if ($previous <= 0) {
            return 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

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
                
                // Log admin login
                AuditLog::log(
                    'admin.login',
                    AuditLog::TYPE_LOGIN,
                    "Admin {$user->name} logged in",
                    User::class,
                    $user->id
                );
                
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
        $stats = $this->getDashboardStats();
        return view('admin.dashboard', $stats);
    }

    /**
     * Get dashboard statistics
     */
    private function getDashboardStats()
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        $lastWeek = $now->copy()->subWeek();

        // Total Users
        $totalUsers = User::count();
        $usersLastMonth = User::where('created_at', '<', $lastMonth)->count();
        $usersGrowth = $this->calculateGrowth($totalUsers, $usersLastMonth);

        // Verified Breeders (users with breeder_certificate approved)
        $verifiedBreeders = User::whereHas('userAuth', function ($q) {
            $q->where('auth_type', 'breeder_certificate')
              ->where('status', 'approved');
        })->count();
        $breedersLastMonth = User::whereHas('userAuth', function ($q) use ($lastMonth) {
            $q->where('auth_type', 'breeder_certificate')
              ->where('status', 'approved')
              ->where('updated_at', '<', $lastMonth);
        })->count();
        $breedersGrowth = $this->calculateGrowth($verifiedBreeders, $breedersLastMonth);

        // Verified Shooters (users with shooter_certificate approved)
        $verifiedShooters = User::whereHas('userAuth', function ($q) {
            $q->where('auth_type', 'shooter_certificate')
              ->where('status', 'approved');
        })->count();
        $shootersLastWeek = User::whereHas('userAuth', function ($q) use ($lastWeek) {
            $q->where('auth_type', 'shooter_certificate')
              ->where('status', 'approved')
              ->where('updated_at', '<', $lastWeek);
        })->count();
        $shootersGrowth = $this->calculateGrowth($verifiedShooters, $shootersLastWeek);

        // Pet Statistics
        $activePets = Pet::where('status', 'active')->count();
        $activePetsLastWeek = Pet::where('status', 'active')
            ->where('updated_at', '<', $lastWeek)->count();
        $activePetsGrowth = $this->calculateGrowth($activePets, $activePetsLastWeek);

        $disabledPets = Pet::where('status', 'disabled')->count();
        $disabledPetsLastWeek = Pet::where('status', 'disabled')
            ->where('updated_at', '<', $lastWeek)->count();
        $disabledPetsGrowth = $this->calculateGrowth($disabledPets, $disabledPetsLastWeek);

        // Pets on cooldown (using cooldown_until timestamp)
        $cooldownPets = Pet::onCooldown()->count();
        $cooldownPetsLastMonth = Pet::where('cooldown_until', '>', $lastMonth)
            ->where('cooldown_until', '<=', $now)
            ->count();
        $cooldownPetsGrowth = $this->calculateGrowth($cooldownPets, $cooldownPetsLastMonth);

        // Subscription Statistics
        $standardSubscribers = User::where('subscription_tier', 'standard')->count();
        $standardLastMonth = User::where('subscription_tier', 'standard')
            ->where('updated_at', '<', $lastMonth)->count();
        $standardGrowth = $this->calculateGrowth($standardSubscribers, $standardLastMonth);

        $premiumSubscribers = User::where('subscription_tier', 'premium')->count();
        $premiumLastMonth = User::where('subscription_tier', 'premium')
            ->where('updated_at', '<', $lastMonth)->count();
        $premiumGrowth = $this->calculateGrowth($premiumSubscribers, $premiumLastMonth);

        // Monthly New Users for Chart (last 12 months)
        $monthlyUsers = User::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $now->copy()->subYear())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Pending Safety Reports
        $pendingReports = SafetyReport::where('status', SafetyReport::STATUS_PENDING)->count();

        // Breeding Matches Trend (last 6 months)
        $matchesTrend = MatchRequest::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $now->copy()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Top Rated Users based on reputation score
        $topUsers = User::query()
            ->selectRaw('*, (average_rating * 10 + review_count * 2 - warning_count * 50) as reputation_score')
            ->with('roles')
            ->orderByDesc('reputation_score')
            ->take(5)
            ->get();

        return compact(
            'totalUsers', 'usersGrowth',
            'verifiedBreeders', 'breedersGrowth',
            'verifiedShooters', 'shootersGrowth',
            'activePets', 'activePetsGrowth',
            'disabledPets', 'disabledPetsGrowth',
            'cooldownPets', 'cooldownPetsGrowth',
            'standardSubscribers', 'standardGrowth',
            'premiumSubscribers', 'premiumGrowth',
            'pendingReports',
            'monthlyUsers', 'matchesTrend',
            'topUsers'
        );
    }

    /**
     * Handle admin logout.
     */
    public function logout(Request $request)
    {
        $user = Auth::user();
        
        // Log admin logout before actually logging out
        if ($user) {
            AuditLog::log(
                'admin.logout',
                AuditLog::TYPE_LOGOUT,
                "Admin {$user->name} logged out",
                User::class,
                $user->id
            );
        }
        
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

        $query = User::with(['roles', 'userAuth'])
            ->withCount('reportsAgainst');

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

        // Filter by document status
        if ($request->filled('doc_status')) {
            $docStatus = $request->doc_status;
            if ($docStatus === 'missing') {
                $query->whereDoesntHave('userAuth');
            } elseif ($docStatus === 'expired') {
                $query->whereHas('userAuth', function ($q) {
                    $q->whereNotNull('expiry_date')
                      ->where('expiry_date', '<', Carbon::now());
                });
            } elseif ($docStatus === 'valid') {
                $query->whereHas('userAuth')
                    ->whereDoesntHave('userAuth', function ($q) {
                        $q->whereNotNull('expiry_date')
                          ->where('expiry_date', '<', Carbon::now());
                    });
            }
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

        $users = $query->filterByDate($request)->paginate(15)->appends($request->all());

        return view('admin.users.index', compact('users', 'status'));
    }

    /**
     * Display admin management page.
     */
    public function adminsIndex(Request $request)
    {
        $admins = User::whereHas('roles', function ($q) {
            $q->where('role_type', 'admin');
        })->with('roles')->paginate(15);

        return view('admin.admins.index', compact('admins'));
    }

    /**
     * Store a new admin user or promote existing.
     */
    public function storeAdmin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'name' => 'required_without:existing_user|string|max:255',
            'password' => 'required_without:existing_user|string|min:8',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);
            $action = 'admin.create';
            $description = "New admin created: {$user->email}";
        } else {
            $action = 'admin.promote';
            $description = "Existing user promoted to admin: {$user->email}";
        }

        $adminRole = Role::firstOrCreate(['role_type' => 'admin']);
        
        if (!$user->roles()->where('roles.role_id', $adminRole->role_id)->exists()) {
            $user->roles()->attach($adminRole->role_id);
        }

        AuditLog::log(
            $action,
            AuditLog::TYPE_CREATE,
            $description,
            User::class,
            $user->id
        );

        return redirect()->route('admin.admins.index')->with('success', 'Admin added successfully.');
    }

    /**
     * Revoke admin status from a user.
     */
    public function revokeAdmin($userId)
    {
        if ($userId == Auth::id()) {
            return redirect()->back()->with('error', 'You cannot revoke your own admin status.');
        }

        $user = User::findOrFail($userId);
        $adminRole = Role::where('role_type', 'admin')->first();

        if ($adminRole) {
            $user->roles()->detach($adminRole->role_id);
            
            AuditLog::log(
                'admin.revoke',
                AuditLog::TYPE_DELETE,
                "Admin status revoked from: {$user->email}",
                User::class,
                $user->id
            );
        }

        return redirect()->route('admin.admins.index')->with('success', 'Admin status revoked successfully.');
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

        $pets = $query->filterByDate($request)->paginate(10)->appends($request->query());

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
            'vaccinationCards.protocol',
            'vaccinationCards.shots',
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
     * Display user details page.
     */
    public function userDetails($userId)
    {
        $user = User::with([
            'roles',
            'userAuth',
            'pets',
            'warnings.admin',
            'reportsAgainst'
        ])->withCount(['pets', 'reportsAgainst'])->findOrFail($userId);

        return view('admin.users.show', compact('user'));
    }

    /**
     * Update user status (suspend/ban).
     */
    public function updateUserStatus(Request $request, $userId)
    {
        $request->validate([
            'status' => 'required|in:active,suspended,banned',
            'suspension_reason' => 'required_if:status,suspended,banned|nullable|string|max:500',
            'suspension_duration' => 'nullable|string|in:1_day,3_days,7_days,30_days,indefinite',
        ]);

        $user = User::findOrFail($userId);
        $oldStatus = $user->status ?? 'active';
        
        $user->status = $request->status;
        
        if (in_array($request->status, ['suspended', 'banned'])) {
            $user->suspension_reason = $request->suspension_reason;
            $user->suspended_at = now();
            
            // Handle duration
            if ($request->suspension_duration && $request->suspension_duration !== 'indefinite') {
                $days = match($request->suspension_duration) {
                    '1_day' => 1,
                    '3_days' => 3,
                    '7_days' => 7,
                    '30_days' => 30,
                    default => null
                };
                
                if ($days) {
                    $user->suspension_end_date = now()->addDays($days);
                } else {
                    $user->suspension_end_date = null;
                }
            } else {
                $user->suspension_end_date = null; // Indefinite
            }
        } else {
            $user->suspension_reason = null;
            $user->suspended_at = null;
            $user->suspension_end_date = null;
        }
        
        $user->save();

        AuditLog::log(
            'user.status_updated',
            AuditLog::TYPE_UPDATE,
            "User {$user->name} status changed from {$oldStatus} to {$request->status}",
            User::class,
            $userId,
            ['status' => $oldStatus],
            ['status' => $request->status, 'reason' => $request->suspension_reason, 'end_date' => $user->suspension_end_date]
        );

        return redirect()->back()->with('success', 'User status updated successfully.');
    }

    /**
     * Update pet status.
     */
    public function updatePetStatus(Request $request, $petId)
    {
        $request->validate([
            'status' => 'required|in:active,disabled,cooldown,banned',
            'suspension_reason' => 'required_if:status,disabled,banned|nullable|string|max:500',
            'suspension_duration' => 'nullable|string|in:1_day,3_days,7_days,30_days,indefinite',
        ]);

        $pet = Pet::findOrFail($petId);
        $oldStatus = $pet->status;
        
        $pet->status = $request->status;
        
        if (in_array($request->status, ['disabled', 'banned'])) {
            $pet->suspension_reason = $request->suspension_reason;
            $pet->suspended_at = now();
            
            // Handle duration
            if ($request->suspension_duration && $request->suspension_duration !== 'indefinite') {
                $days = match($request->suspension_duration) {
                    '1_day' => 1,
                    '3_days' => 3,
                    '7_days' => 7,
                    '30_days' => 30,
                    default => null
                };
                
                if ($days) {
                    $pet->suspension_end_date = now()->addDays($days);
                } else {
                    $pet->suspension_end_date = null;
                }
            } else {
                $pet->suspension_end_date = null; // Indefinite
            }
        } elseif ($request->status === 'active') {
            // Only clear reason if reactivating, keep history if just cooling down? 
            // Cooldown is separate from suspension, but let's clear suspension fields if active.
            $pet->suspension_reason = null;
            $pet->suspended_at = null;
            $pet->suspension_end_date = null;
        }
        
        $pet->save();

        // Log pet status update
        AuditLog::log(
            'pet.status_updated',
            AuditLog::TYPE_UPDATE,
            "Pet {$pet->name} status changed from {$oldStatus} to {$request->status}",
            Pet::class,
            $petId,
            ['status' => $oldStatus],
            ['status' => $request->status, 'reason' => $request->suspension_reason, 'end_date' => $pet->suspension_end_date]
        );

        return redirect()->back()->with('success', 'Pet status updated successfully.');
    }

    /**
     * Delete a pet.
     */
    public function deletePet($petId)
    {
        $pet = Pet::findOrFail($petId);
        $petName = $pet->name;
        $pet->delete();

        // Log pet deletion
        AuditLog::log(
            'pet.deleted',
            AuditLog::TYPE_DELETE,
            "Pet {$petName} was deleted",
            Pet::class,
            $petId
        );

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
    public function matchHistory(Request $request)
    {
        $query = MatchRequest::with([
            'requesterPet.owner',
            'requesterPet.photos',
            'targetPet.owner',
            'targetPet.photos',
            'conversation.breedingContract'
        ]);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('date_range')) {
            switch ($request->date_range) {
                case '7':
                    $query->where('created_at', '>=', Carbon::now()->subDays(7));
                    break;
                case '30':
                    $query->where('created_at', '>=', Carbon::now()->subDays(30));
                    break;
                case '90':
                    $query->where('created_at', '>=', Carbon::now()->subDays(90));
                    break;
            }
        }

        // Search by pet name or owner name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('requesterPet', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('targetPet', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('requesterPet.owner', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('targetPet.owner', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
            });
        }

        $matches = $query->filterByDate($request)->orderBy('created_at', 'desc')->paginate(15)->appends($request->query());

        // Get statistics
        $totalMatches = MatchRequest::count();
        $pendingMatches = MatchRequest::where('status', 'pending')->count();
        $acceptedMatches = MatchRequest::where('status', 'accepted')->count();
        $completedMatches = MatchRequest::where('status', 'completed')->count();

        return view('admin.match-history', compact(
            'matches',
            'totalMatches',
            'pendingMatches',
            'acceptedMatches',
            'completedMatches'
        ));
    }

    /**
     * Display analytics page.
     */
    public function analytics()
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        $twoMonthsAgo = $now->copy()->subMonths(2);

        // Pricing constants (matching SubscriptionController)
        $standardPrice = 199;
        $premiumPrice = 499;

        // Match request revenue from free tier users
        $matchRequestRevenue = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
            ->where('status', \App\Models\Payment::STATUS_PAID)
            ->sum('amount');

        // Current Revenue (based on current subscriptions + match request payments)
        $premiumCount = User::where('subscription_tier', 'premium')->count();
        $standardCount = User::where('subscription_tier', 'standard')->count();
        $subscriptionRevenue = ($premiumCount * $premiumPrice) + ($standardCount * $standardPrice);
        $totalRevenue = $subscriptionRevenue + $matchRequestRevenue;

        // Match request revenue last month
        $matchRequestRevenueLastMonth = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
            ->where('status', \App\Models\Payment::STATUS_PAID)
            ->where('paid_at', '<', $lastMonth)
            ->sum('amount');

        // Last month's revenue (based on subscriptions that existed last month + match payments)
        $premiumLastMonth = User::where('subscription_tier', 'premium')
            ->where('updated_at', '<', $lastMonth)->count();
        $standardLastMonth = User::where('subscription_tier', 'standard')
            ->where('updated_at', '<', $lastMonth)->count();
        $subscriptionRevenueLastMonth = ($premiumLastMonth * $premiumPrice) + ($standardLastMonth * $standardPrice);
        $revenueLastMonth = $subscriptionRevenueLastMonth + $matchRequestRevenueLastMonth;
        $revenueGrowth = $revenueLastMonth > 0 
            ? $this->calculateGrowth($totalRevenue, $revenueLastMonth)
            : ($totalRevenue > 0 ? 100 : 0);

        // Active Users (users with activity in last 30 days)
        $activeUsers = User::where('updated_at', '>=', $lastMonth)->count();
        $activeUsersLastMonth = User::whereBetween('updated_at', [$twoMonthsAgo, $lastMonth])->count();
        $activeUsersGrowth = $this->calculateGrowth($activeUsers, $activeUsersLastMonth);

        // Matches Made
        $matchesMade = MatchRequest::where('status', 'accepted')->count();
        $matchesLastWeek = MatchRequest::where('status', 'accepted')
            ->where('updated_at', '<', $now->copy()->subWeek())->count();
        $matchesGrowth = $this->calculateGrowth($matchesMade, $matchesLastWeek);

        // Conversion Rate (accepted matches / total match requests)
        $totalRequests = MatchRequest::count();
        $conversionRate = $totalRequests > 0 
            ? round(($matchesMade / $totalRequests) * 100, 1)
            : 0;
        
        // Calculate last month's conversion rate
        $totalRequestsLastMonth = MatchRequest::where('created_at', '<', $lastMonth)->count();
        $acceptedLastMonth = MatchRequest::where('status', 'accepted')
            ->where('created_at', '<', $lastMonth)->count();
        $conversionRateLastMonth = $totalRequestsLastMonth > 0 
            ? round(($acceptedLastMonth / $totalRequestsLastMonth) * 100, 1)
            : 0;
        $conversionGrowth = round($conversionRate - $conversionRateLastMonth, 1);

        // Monthly data for charts
        $monthlyData = User::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as users')
        )
            ->where('created_at', '>=', $now->copy()->subYear())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $monthlyMatches = MatchRequest::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as matches'),
            DB::raw('SUM(CASE WHEN status = "accepted" THEN 1 ELSE 0 END) as accepted')
        )
            ->where('created_at', '>=', $now->copy()->subYear())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return view('admin.analytics', compact(
            'totalRevenue', 'revenueGrowth',
            'activeUsers', 'activeUsersGrowth',
            'matchesMade', 'matchesGrowth',
            'conversionRate', 'conversionGrowth',
            'monthlyData', 'monthlyMatches'
        ));
    }

    /**
     * Display billing page.
     */
    public function billing()
    {
        // Subscription pricing constants (matching SubscriptionController)
        $standardPrice = 199;
        $premiumPrice = 499;
        $matchRequestFee = 50;

        // Subscription statistics
        $freeUsers = User::where('subscription_tier', 'free')
            ->orWhereNull('subscription_tier')
            ->count();
        $standardUsers = User::where('subscription_tier', 'standard')->count();
        $premiumUsers = User::where('subscription_tier', 'premium')->count();
        $totalUsers = $freeUsers + $standardUsers + $premiumUsers;

        // Calculate percentages
        $freePercentage = $totalUsers > 0 ? round(($freeUsers / $totalUsers) * 100) : 0;
        $standardPercentage = $totalUsers > 0 ? round(($standardUsers / $totalUsers) * 100) : 0;
        $premiumPercentage = $totalUsers > 0 ? round(($premiumUsers / $totalUsers) * 100) : 0;

        // Growth calculations
        $lastMonth = Carbon::now()->subMonth();
        $standardLastMonth = User::where('subscription_tier', 'standard')
            ->where('updated_at', '<', $lastMonth)->count();
        $standardGrowth = $this->calculateGrowth($standardUsers, $standardLastMonth);

        $premiumLastMonth = User::where('subscription_tier', 'premium')
            ->where('updated_at', '<', $lastMonth)->count();
        $premiumGrowth = $this->calculateGrowth($premiumUsers, $premiumLastMonth);

        // Match request payment statistics for free tier users
        $matchRequestPayments = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
            ->where('status', \App\Models\Payment::STATUS_PAID)
            ->count();
        $matchRequestRevenue = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
            ->where('status', \App\Models\Payment::STATUS_PAID)
            ->sum('amount');

        // Growth calculations for match request payments (this month vs last month)
        $startOfThisMonth = Carbon::now()->startOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();
        
        $matchRequestPaymentsThisMonth = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
            ->where('status', \App\Models\Payment::STATUS_PAID)
            ->where('paid_at', '>=', $startOfThisMonth)
            ->count();
        $matchRequestPaymentsLastMonth = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
            ->where('status', \App\Models\Payment::STATUS_PAID)
            ->whereBetween('paid_at', [$startOfLastMonth, $endOfLastMonth])
            ->count();
        $matchRequestGrowth = $this->calculateGrowth($matchRequestPaymentsThisMonth, $matchRequestPaymentsLastMonth);

        // Recent subscription changes
        $recentSubscriptions = User::whereNotNull('subscription_tier')
            ->where('subscription_tier', '!=', 'free')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get(['id', 'name', 'email', 'subscription_tier', 'updated_at']);

        return view('admin.billing', compact(
            'freeUsers', 'freePercentage',
            'standardUsers', 'standardPercentage', 'standardGrowth',
            'premiumUsers', 'premiumPercentage', 'premiumGrowth',
            'totalUsers', 'recentSubscriptions',
            'matchRequestPayments', 'matchRequestRevenue', 'matchRequestGrowth',
            'standardPrice', 'premiumPrice', 'matchRequestFee'
        ));
    }

    /**
     * Display reports management page.
     */
    public function reports(Request $request)
    {
        $query = SafetyReport::with(['reporter', 'reported', 'reviewer']);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by reason
        if ($request->filled('reason')) {
            $query->where('reason', $request->reason);
        }

        // Filter by date range
        if ($request->filled('date_range')) {
            switch ($request->date_range) {
                case '7':
                    $query->where('created_at', '>=', Carbon::now()->subDays(7));
                    break;
                case '30':
                    $query->where('created_at', '>=', Carbon::now()->subDays(30));
                    break;
                case '90':
                    $query->where('created_at', '>=', Carbon::now()->subDays(90));
                    break;
            }
        }

        // Search by reporter or reported user name/email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('reporter', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('reported', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%");
                });
            });
        }

        $reports = $query->orderBy('created_at', 'desc')->paginate(15)->appends($request->query());

        // Statistics
        $totalReports = SafetyReport::count();
        $pendingReports = SafetyReport::where('status', SafetyReport::STATUS_PENDING)->count();
        $resolvedReports = SafetyReport::where('status', SafetyReport::STATUS_RESOLVED)->count();
        $dismissedReports = SafetyReport::where('status', SafetyReport::STATUS_DISMISSED)->count();

        return view('admin.reports', compact(
            'reports',
            'totalReports',
            'pendingReports',
            'resolvedReports',
            'dismissedReports'
        ));
    }

    /**
     * Get report details for modal.
     */
    public function getReportDetails($id)
    {
        $report = SafetyReport::with(['reporter', 'reported', 'reviewer'])->findOrFail($id);

        // Count how many times the reported user has been reported (by distinct reporters)
        $totalReportsAgainstUser = SafetyReport::where('reported_id', $report->reported_id)->count();
        $distinctReporters = SafetyReport::where('reported_id', $report->reported_id)
            ->distinct('reporter_id')
            ->count('reporter_id');

        // Count how many users have blocked the reported user
        $blockedByCount = UserBlock::where('blocked_id', $report->reported_id)->count();

        // Get other reports against the same user
        $otherReports = SafetyReport::where('reported_id', $report->reported_id)
            ->where('id', '!=', $report->id)
            ->with('reporter:id,name')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get(['id', 'reporter_id', 'reason', 'status', 'created_at']);

        return response()->json([
            'success' => true,
            'report' => [
                'id' => $report->id,
                'reason' => $report->reason,
                'description' => $report->description,
                'status' => $report->status,
                'admin_notes' => $report->admin_notes,
                'resolution_action' => $report->resolution_action,
                'created_at' => $report->created_at->format('M d, Y h:i A'),
                'reviewed_at' => $report->reviewed_at ? $report->reviewed_at->format('M d, Y h:i A') : null,
                'reporter' => [
                    'id' => $report->reporter->id,
                    'name' => $report->reporter->name,
                    'email' => $report->reporter->email,
                    'profile_image' => $report->reporter->profile_image
                        ? Storage::disk('do_spaces')->url($report->reporter->profile_image)
                        : null,
                ],
                'reported' => [
                    'id' => $report->reported->id,
                    'name' => $report->reported->name,
                    'email' => $report->reported->email,
                    'profile_image' => $report->reported->profile_image
                        ? Storage::disk('do_spaces')->url($report->reported->profile_image)
                        : null,
                ],
                'reviewer' => $report->reviewer ? [
                    'name' => $report->reviewer->name,
                ] : null,
            ],
            'repeat_offender' => [
                'total_reports' => $totalReportsAgainstUser,
                'distinct_reporters' => $distinctReporters,
                'blocked_by_count' => $blockedByCount,
                'other_reports' => $otherReports,
            ],
        ]);
    }

    /**
     * Review/update a report (approve, dismiss, etc.)
     */
    public function reviewReport(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:reviewed,resolved,dismissed',
            'admin_notes' => 'nullable|string|max:1000',
            'resolution_action' => 'nullable|string|in:none,warning,ban',
        ]);

        $report = SafetyReport::findOrFail($id);
        $oldStatus = $report->status;

        $report->status = $request->status;
        $report->admin_notes = $request->admin_notes;
        $report->resolution_action = $request->resolution_action ?? 'none';
        $report->reviewed_by = Auth::id();
        $report->reviewed_at = Carbon::now();
        $report->save();

        // If action is ban, disable the reported user's account
        if ($request->resolution_action === 'ban') {
            $reportedUser = User::findOrFail($report->reported_id);
            $reportedUser->status = 'banned';
            $reportedUser->save();

            AuditLog::log(
                'user.banned_via_report',
                AuditLog::TYPE_UPDATE,
                "User {$reportedUser->name} was banned via report #{$report->id}",
                User::class,
                $reportedUser->id,
                ['status' => 'active'],
                ['status' => 'banned']
            );
        }

        // Log the review action
        AuditLog::log(
            'report.reviewed',
            AuditLog::TYPE_UPDATE,
            "Report #{$report->id} status changed from {$oldStatus} to {$request->status}" .
                ($request->resolution_action ? " (action: {$request->resolution_action})" : ''),
            SafetyReport::class,
            $report->id,
            ['status' => $oldStatus],
            ['status' => $request->status, 'resolution_action' => $request->resolution_action]
        );

        return response()->json([
            'success' => true,
            'message' => 'Report updated successfully',
        ]);
    }

    /**
     * Display blocks management page.
     */
    public function blocks(Request $request)
    {
        $query = UserBlock::with(['blocker', 'blocked']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('blocker', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('blocked', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
            });
        }

        $blocks = $query->orderBy('created_at', 'desc')->paginate(15)->appends($request->query());
        $totalBlocks = UserBlock::count();

        // Most blocked users (users blocked by the most people)
        $mostBlocked = UserBlock::select('blocked_id', DB::raw('COUNT(*) as block_count'))
            ->groupBy('blocked_id')
            ->orderByDesc('block_count')
            ->limit(5)
            ->with('blocked:id,name,email')
            ->get();

        return view('admin.blocks', compact('blocks', 'totalBlocks', 'mostBlocked'));
    }

    /**
     * Force unblock a user (admin action).
     */
    public function forceUnblock($id)
    {
        $block = UserBlock::findOrFail($id);
        $blockerName = $block->blocker->name ?? 'Unknown';
        $blockedName = $block->blocked->name ?? 'Unknown';

        $block->delete();

        AuditLog::log(
            'block.force_removed',
            AuditLog::TYPE_DELETE,
            "Admin force-removed block: {$blockerName} had blocked {$blockedName}",
            UserBlock::class,
            $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Block removed successfully',
        ]);
    }

    /**
     * Display audit logs page.
     */
    public function auditLogs(Request $request)
    {
        $query = AuditLog::with('user')->filterByDate($request)->orderBy('created_at', 'desc');

        // Filter by action type
        if ($request->filled('action_type')) {
            $query->where('action_type', $request->action_type);
        }

        // Filter by user type (admins only)
        if ($request->filled('user_type') && $request->user_type === 'admins') {
            $query->whereHas('user.roles', function ($q) {
                $q->where('role_type', 'admin');
            });
        }

        // Filter by date range (legacy - replaced by trait but keeping for compatibility if needed)
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(20)->appends($request->query());

        return view('admin.audit-logs', compact('logs'));
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
        // Get recent user registrations (last 7 days)
        $newUsers = User::where('created_at', '>=', Carbon::now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'name', 'email', 'created_at']);

        // Get pending verifications
        $pendingVerifications = UserAuth::where('status', 'pending')
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get recent match requests (last 7 days)
        $recentMatches = MatchRequest::where('created_at', '>=', Carbon::now()->subDays(7))
            ->with(['requesterPet:pet_id,name', 'targetPet:pet_id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get recent payments (last 7 days)
        $recentPayments = \App\Models\Payment::where('status', \App\Models\Payment::STATUS_PAID)
            ->where('paid_at', '>=', Carbon::now()->subDays(7))
            ->with('user:id,name')
            ->orderBy('paid_at', 'desc')
            ->limit(10)
            ->get();

        // Get pending safety reports
        $pendingReports = SafetyReport::where('status', SafetyReport::STATUS_PENDING)
            ->with(['reporter:id,name', 'reported:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Build notifications array
        $notifications = collect();

        // Add new user notifications
        foreach ($newUsers as $user) {
            $notifications->push([
                'type' => 'user_registered',
                'icon' => 'user-plus',
                'color' => 'blue',
                'title' => 'New user registered',
                'message' => "{$user->name} just created an account",
                'created_at' => $user->created_at,
                'is_unread' => $user->created_at >= Carbon::now()->subHours(24),
            ]);
        }

        // Add pending verification notifications
        foreach ($pendingVerifications as $verification) {
            $notifications->push([
                'type' => 'verification_pending',
                'icon' => 'file-text',
                'color' => 'yellow',
                'title' => 'Pending verification',
                'message' => "{$verification->user->name}'s {$verification->auth_type} awaiting review",
                'created_at' => $verification->created_at,
                'is_unread' => true,
            ]);
        }

        // Add recent match notifications
        foreach ($recentMatches as $match) {
            $notifications->push([
                'type' => 'match_request',
                'icon' => 'heart',
                'color' => 'pink',
                'title' => 'New match request',
                'message' => "{$match->requesterPet->name} requested to match with {$match->targetPet->name}",
                'created_at' => $match->created_at,
                'is_unread' => $match->created_at >= Carbon::now()->subHours(24),
            ]);
        }

        // Add payment notifications
        foreach ($recentPayments as $payment) {
            $notifications->push([
                'type' => 'payment_received',
                'icon' => 'credit-card',
                'color' => 'green',
                'title' => 'Payment received',
                'message' => "₱{$payment->amount} received from {$payment->user->name}",
                'created_at' => $payment->paid_at,
                'is_unread' => $payment->paid_at >= Carbon::now()->subHours(24),
            ]);
        }

        // Add safety report notifications
        foreach ($pendingReports as $report) {
            $notifications->push([
                'type' => 'safety_report',
                'icon' => 'shield-alert',
                'color' => 'red',
                'title' => 'Safety report pending',
                'message' => "{$report->reporter->name} reported {$report->reported->name} for {$report->reason}",
                'created_at' => $report->created_at,
                'is_unread' => true,
            ]);
        }

        // Sort by created_at descending
        $notifications = $notifications->sortByDesc('created_at')->take(20)->values();

        // Count unread
        $unreadCount = $notifications->where('is_unread', true)->count();

        return view('admin.notifications', compact('notifications', 'unreadCount'));
    }

    /**
     * Display settings page.
     */
    public function settings()
    {
        return view('admin.settings');
    }

    /**
     * Update admin profile.
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'firstName' => 'nullable|string|max:255',
            'lastName' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . Auth::id(),
            'contact_number' => 'nullable|string|max:20',
        ]);

        $user = Auth::user();
        $user->update($request->only(['name', 'firstName', 'lastName', 'email', 'contact_number']));

        return redirect()->route('admin.profile')->with('profile_success', 'Profile updated successfully.');
    }

    /**
     * Get user details for verification modal
     */
    public function getUserDetails($userId)
    {
        $user = User::with(['roles', 'userAuth', 'warnings.admin'])->findOrFail($userId);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at->format('M d, Y'),
                'roles' => $user->roles->pluck('role_type'),
                'warning_count' => $user->warning_count,
                'warnings' => $user->warnings->map(function ($warning) {
                    return [
                        'id' => $warning->id,
                        'type' => $warning->type,
                        'message' => $warning->message,
                        'admin_name' => $warning->admin->name ?? 'System',
                        'created_at' => $warning->created_at->format('M d, Y h:i A'),
                        'acknowledged_at' => $warning->acknowledged_at ? $warning->acknowledged_at->format('M d, Y h:i A') : null,
                    ];
                }),
                'documents' => $user->userAuth->map(function ($auth) {
                    $expiryDate = $auth->expiry_date;
                    $daysRemaining = null;

                    if ($expiryDate) {
                        $now = Carbon::now();
                        $expiry = Carbon::parse($expiryDate);
                        $daysRemaining = $now->diffInDays($expiry, false);
                    }

                    return [
                        'auth_id' => $auth->auth_id,
                        'auth_type' => $auth->auth_type,
                        'document_path' => $auth->document_path ? Storage::disk('do_spaces')->url($auth->document_path) : null,
                        'status' => $auth->status,
                        'date_created' => $auth->date_created ? $auth->date_created->format('M d, Y') : null,
                        'date_submitted' => $auth->created_at->format('M d, Y h:i A'),
                        'updated_at' => $auth->updated_at->format('M d, Y'),
                        'expiry_date' => $expiryDate ? Carbon::parse($expiryDate)->format('M d, Y') : null,
                        'days_remaining' => $daysRemaining,
                        // Document details from form input
                        'document_number' => $auth->document_number,
                        'document_name' => $auth->document_name,
                        'issue_date' => $auth->issue_date ? Carbon::parse($auth->issue_date)->format('M d, Y') : null,
                        'issuing_authority' => $auth->issuing_authority,
                        'rejection_reason' => $auth->rejection_reason,
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
        $oldStatus = $userAuth->status;
        $userAuth->status = $request->status;
        $userAuth->save();

        // Log verification action
        $actionType = $request->status === 'approved' ? AuditLog::TYPE_VERIFY : AuditLog::TYPE_REJECT;
        AuditLog::log(
            "verification.{$request->status}",
            $actionType,
            "Verification {$request->status} for {$userAuth->auth_type}",
            UserAuth::class,
            $authId,
            ['status' => $oldStatus],
            ['status' => $request->status]
        );

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
        $userName = $user->name;
        $userEmail = $user->email;
        $user->delete();

        // Log user deletion
        AuditLog::log(
            'user.deleted',
            AuditLog::TYPE_DELETE,
            "User {$userName} ({$userEmail}) was deleted",
            User::class,
            $userId
        );

        return response()->json([
            'success' => true,
            'message' => 'User account deleted successfully'
        ]);
    }
}
