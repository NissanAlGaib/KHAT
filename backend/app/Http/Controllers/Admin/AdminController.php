<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pet;
use App\Models\MatchRequest;
use App\Models\BreedingContract;
use App\Models\Litter;
use App\Models\UserAuth;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

        // Breeding Matches Trend (last 6 months)
        $matchesTrend = MatchRequest::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $now->copy()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
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
            'monthlyUsers', 'matchesTrend'
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
     * Update pet status.
     */
    public function updatePetStatus(Request $request, $petId)
    {
        $request->validate([
            'status' => 'required|in:active,disabled,cooldown,banned',
        ]);

        $pet = Pet::findOrFail($petId);
        $oldStatus = $pet->status;
        $pet->status = $request->status;
        $pet->save();

        // Log pet status update
        AuditLog::log(
            'pet.status_updated',
            AuditLog::TYPE_UPDATE,
            "Pet {$pet->name} status changed from {$oldStatus} to {$request->status}",
            Pet::class,
            $petId,
            ['status' => $oldStatus],
            ['status' => $request->status]
        );

        return redirect()->route('admin.pets.details', $petId)
            ->with('success', 'Pet status updated successfully.');
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

        $matches = $query->orderBy('created_at', 'desc')->paginate(15)->appends($request->query());

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
     * Display tickets page.
     */
    public function tickets()
    {
        return view('admin.tickets');
    }

    /**
     * Display audit logs page.
     */
    public function auditLogs(Request $request)
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

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

        // Filter by date range
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
