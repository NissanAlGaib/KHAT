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
use App\Models\SubscriptionTier;
use App\Http\Controllers\Admin\Traits\Exportable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AdminController extends Controller
{
    use Exportable;

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
     * Derive a single aggregate document status from a user's verification records.
     */
    private function getAggregateDocumentStatus($userAuthRecords): string
    {
        if ($userAuthRecords->isEmpty()) {
            return 'missing';
        }

        $now = Carbon::now();

        $hasExpired = $userAuthRecords->contains(function ($auth) use ($now) {
            return $auth->expiry_date && Carbon::parse($auth->expiry_date)->lt($now);
        });

        if ($hasExpired) {
            return 'expired';
        }

        if ($userAuthRecords->contains(fn($auth) => $auth->status === 'rejected')) {
            return 'rejected';
        }

        if ($userAuthRecords->contains(fn($auth) => $auth->status === 'pending')) {
            return 'pending';
        }

        if ($userAuthRecords->contains(fn($auth) => $auth->status === 'approved')) {
            return 'valid';
        }

        return 'pending';
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
    public function dashboard(Request $request)
    {
        $stats = $this->getDashboardStats($request);
        return view('admin.dashboard', $stats);
    }

    /**
     * Get dashboard statistics
     */
    private function getDashboardStats(Request $request = null)
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        $lastWeek = $now->copy()->subWeek();

        // Check if date filter is active
        $hasDateFilter = $request && $request->filled('start_date') && $request->filled('end_date');

        // Optional date range for chart filtering
        $chartStart = $request && $request->filled('start_date')
            ? Carbon::parse($request->start_date)->startOfDay()
            : $now->copy()->subYear();
        $chartEnd = $request && $request->filled('end_date')
            ? Carbon::parse($request->end_date)->endOfDay()
            : $now->copy()->endOfDay();

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

        // Filtered counts for "in selected period" display
        $filteredUsers = $hasDateFilter ? User::whereBetween('created_at', [$chartStart, $chartEnd])->count() : null;
        $filteredBreeders = $hasDateFilter ? User::whereHas('userAuth', function ($q) use ($chartStart, $chartEnd) {
            $q->where('auth_type', 'breeder_certificate')->where('status', 'approved')->whereBetween('updated_at', [$chartStart, $chartEnd]);
        })->count() : null;
        $filteredShooters = $hasDateFilter ? User::whereHas('userAuth', function ($q) use ($chartStart, $chartEnd) {
            $q->where('auth_type', 'shooter_certificate')->where('status', 'approved')->whereBetween('updated_at', [$chartStart, $chartEnd]);
        })->count() : null;
        $filteredActivePets = $hasDateFilter ? Pet::where('status', 'active')->whereBetween('created_at', [$chartStart, $chartEnd])->count() : null;
        $filteredDisabledPets = $hasDateFilter ? Pet::where('status', 'disabled')->whereBetween('updated_at', [$chartStart, $chartEnd])->count() : null;
        $filteredStandard = $hasDateFilter ? User::where('subscription_tier', 'standard')->whereBetween('updated_at', [$chartStart, $chartEnd])->count() : null;
        $filteredPremium = $hasDateFilter ? User::where('subscription_tier', 'premium')->whereBetween('updated_at', [$chartStart, $chartEnd])->count() : null;

        // Monthly New Users for Chart (filtered by date range)
        $monthlyUsers = User::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as count')
        )
            ->whereBetween('created_at', [$chartStart, $chartEnd])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Pending Safety Reports
        $pendingReports = SafetyReport::where('status', SafetyReport::STATUS_PENDING)->count();

        // Breeding Matches Trend (filtered by date range)
        $matchesTrend = MatchRequest::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as count')
        )
            ->whereBetween('created_at', [$chartStart, $chartEnd])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Top Rated Users based on reputation score (exclude admins)
        $topUsers = User::query()
            ->selectRaw('*, (average_rating * 10 + review_count * 2 - warning_count * 50) as reputation_score')
            ->whereDoesntHave('roles', function ($q) {
                $q->where('role_type', 'admin');
            })
            ->with('roles')
            ->orderByDesc('reputation_score')
            ->take(5)
            ->get();

        return compact(
            'totalUsers',
            'usersGrowth',
            'verifiedBreeders',
            'breedersGrowth',
            'verifiedShooters',
            'shootersGrowth',
            'activePets',
            'activePetsGrowth',
            'disabledPets',
            'disabledPetsGrowth',
            'cooldownPets',
            'cooldownPetsGrowth',
            'standardSubscribers',
            'standardGrowth',
            'premiumSubscribers',
            'premiumGrowth',
            'hasDateFilter',
            'filteredUsers',
            'filteredBreeders',
            'filteredShooters',
            'filteredActivePets',
            'filteredDisabledPets',
            'filteredStandard',
            'filteredPremium',
            'pendingReports',
            'monthlyUsers',
            'matchesTrend',
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
     * Global search across users, pets, and match requests.
     * Returns JSON for the navbar live-search dropdown.
     */
    public function globalSearch(Request $request)
    {
        $q = trim($request->get('q', ''));

        if (strlen($q) < 2) {
            return response()->json(['results' => []]);
        }

        $results = [];

        // Users (name, email)
        $users = User::where(function ($query) use ($q) {
            $query->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%");
        })->limit(5)->get(['id', 'name', 'email', 'profile_image']);

        foreach ($users as $user) {
            $results[] = [
                'type'     => 'user',
                'label'    => $user->name,
                'sublabel' => $user->email,
                'url'      => route('admin.users.show', $user->id),
                'avatar'   => $user->profile_image
                    ? Storage::disk('do_spaces')->url($user->profile_image)
                    : null,
            ];
        }

        // Pets (name, breed, owner name)
        $pets = Pet::with('owner:id,name')
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('breed', 'like', "%{$q}%")
                    ->orWhere('microchip_id', 'like', "%{$q}%")
                    ->orWhereHas('owner', fn($oq) => $oq->where('name', 'like', "%{$q}%"));
            })->limit(5)->get(['pet_id', 'name', 'species', 'breed', 'user_id']);

        foreach ($pets as $pet) {
            $results[] = [
                'type'     => 'pet',
                'label'    => $pet->name,
                'sublabel' => ucfirst($pet->species ?? '') . ($pet->breed ? ' · ' . $pet->breed : '') . ($pet->owner ? ' · ' . $pet->owner->name : ''),
                'url'      => route('admin.pets.details', $pet->pet_id),
                'avatar'   => null,
            ];
        }

        // Match requests (pet names)
        $matches = MatchRequest::with(['requesterPet:pet_id,name', 'targetPet:pet_id,name'])
            ->where(function ($query) use ($q) {
                $query->whereHas('requesterPet', fn($pq) => $pq->where('name', 'like', "%{$q}%"))
                    ->orWhereHas('targetPet',     fn($pq) => $pq->where('name', 'like', "%{$q}%"))
                    ->orWhereHas('requesterPet.owner', fn($uq) => $uq->where('name', 'like', "%{$q}%"))
                    ->orWhereHas('targetPet.owner',    fn($uq) => $uq->where('name', 'like', "%{$q}%"));
            })->limit(3)->get(['id', 'requester_pet_id', 'target_pet_id', 'status']);

        foreach ($matches as $match) {
            $results[] = [
                'type'     => 'match',
                'label'    => ($match->requesterPet->name ?? '?') . ' × ' . ($match->targetPet->name ?? '?'),
                'sublabel' => 'Match · ' . ucfirst($match->status),
                'url'      => route('admin.matches') . '?search=' . urlencode($q),
                'avatar'   => null,
            ];
        }

        return response()->json(['results' => $results]);
    }

    /**
     * Display user management page.
     */
    public function usersIndex(Request $request)
    {
        $status = $request->get('status', 'verified');

        $query = User::with(['roles', 'userAuth'])
            ->withCount('reportsAgainst')
            ->where(function ($q) {
                // Exclude pure admins — show only users with at least one non-admin role
                $q->whereDoesntHave('roles', function ($q2) {
                    $q2->where('role_type', 'admin');
                })->orWhereHas('roles', function ($q2) {
                    $q2->whereIn('role_type', ['breeder', 'shooter']);
                });
            });

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
            } elseif ($docStatus === 'rejected') {
                $query->whereHas('userAuth', function ($q) {
                    $q->where('status', 'rejected');
                });
            } elseif ($docStatus === 'pending') {
                $query->whereHas('userAuth', function ($q) {
                    $q->where('status', 'pending');
                });
            } elseif ($docStatus === 'valid') {
                $query->whereHas('userAuth', function ($q) {
                    $q->where('status', 'approved');
                })
                    ->whereDoesntHave('userAuth', function ($q) {
                        $q->where('status', 'pending');
                    })
                    ->whereDoesntHave('userAuth', function ($q) {
                        $q->where('status', 'rejected');
                    })
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

        if ($request->has('export')) {
            $viewData = ['status' => $status];
            $csvColumns = [
                'ID' => 'id',
                'Name' => 'name',
                'Email' => 'email',
                'Roles' => function ($user) {
                    return $user->roles->pluck('role_type')->implode(', ');
                },
                'Status' => function ($user) {
                    return $user->status ?? 'active';
                },
                'Document Status' => function ($user) {
                    return ucfirst($this->getAggregateDocumentStatus($user->userAuth));
                },
                'Subscription' => function ($user) {
                    return $user->subscription_tier ?? 'free';
                },
                'Joined' => function ($user) {
                    return $user->created_at->format('Y-m-d H:i');
                }
            ];

            return $this->export($query->filterByDate($request), $request->export, 'users_export', 'admin.exports.users-pdf', $viewData, $csvColumns);
        }

        $perPage = $request->input('per_page', 15);
        $users = $query->filterByDate($request)->paginate($perPage)->appends($request->all());
        $users->getCollection()->transform(function ($user) {
            $user->document_status = $this->getAggregateDocumentStatus($user->userAuth);

            return $user;
        });

        $subscriptionTiers = SubscriptionTier::where('is_active', true)->orderBy('price')->get();

        return view('admin.users.index', compact('users', 'status', 'subscriptionTiers'));
    }

    /**
     * Display admin management page.
     */
    public function adminsIndex(Request $request)
    {
        $query = User::whereHas('roles', function ($q) {
            $q->where('role_type', 'admin');
        })->with('roles');

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('export')) {
            $csvColumns = [
                'ID' => 'id',
                'Name' => 'name',
                'Email' => 'email',
                'Joined' => function ($row) {
                    return $row->created_at->format('Y-m-d H:i');
                }
            ];
            return $this->export($query, $request->export, 'admins_export', 'admin.exports.admins-pdf', [], $csvColumns);
        }

        $perPage = $request->input('per_page', 15);
        $admins = $query->paginate($perPage);

        return view('admin.admins.index', compact('admins'));
    }

    /**
     * Store a new admin user or promote existing.
     */
    public function storeAdmin(Request $request)
    {
        // First validate email
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // New user — name and password are required
            $request->validate([
                'name' => 'required|string|max:255',
                'password' => 'required|string|min:8',
            ], [
                'name.required' => 'Full name is required when creating a new admin account.',
                'password.required' => 'Password is required when creating a new admin account.',
                'password.min' => 'Password must be at least 8 characters.',
            ]);

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
            // Explicitly delete from pivot to ensure it works
            DB::table('user_roles')
                ->where('user_id', $user->id)
                ->where('role_id', $adminRole->role_id)
                ->delete();

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
     * Check if an email belongs to an existing user (AJAX endpoint for admin form).
     */
    public function checkAdminEmail(Request $request)
    {
        $email = $request->get('email');
        $user = User::where('email', $email)->first();

        if ($user) {
            $isAdmin = $user->roles()->where('role_type', 'admin')->exists();
            return response()->json([
                'exists' => true,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $isAdmin,
            ]);
        }

        return response()->json(['exists' => false]);
    }

    /**
     * Display admin detail page.
     */
    public function showAdmin($userId)
    {
        $admin = User::with('roles')
            ->whereHas('roles', function ($q) {
                $q->where('role_type', 'admin');
            })
            ->findOrFail($userId);

        // Get recent admin activity from audit logs
        $recentActivity = AuditLog::where('user_id', $admin->id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        // Find who promoted this user to admin (from audit log)
        $promotionLog = AuditLog::where('model_type', User::class)
            ->where('model_id', $admin->id)
            ->whereIn('action', ['admin.create', 'admin.promote'])
            ->orderBy('created_at', 'desc')
            ->first();

        return view('admin.admins.show', compact('admin', 'recentActivity', 'promotionLog'));
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

        // Search by pet name, owner name, or microchip ID
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('pet_id', 'like', "%{$search}%")
                    ->orWhere('microchip_id', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('export')) {
            $csvColumns = [
                'ID' => 'pet_id',
                'Name' => 'name',
                'Type' => 'species',
                'Breed' => 'breed',
                'Owner' => function ($row) {
                    return $row->owner->name ?? 'Unknown';
                },
                'Sex' => 'sex',
                'Status' => 'status'
            ];
            return $this->export($query->filterByDate($request), $request->export, 'pets_export', 'admin.exports.pets-pdf', [], $csvColumns);
        }

        $perPage = $request->input('per_page', 10);
        $pets = $query->filterByDate($request)->paginate($perPage)->appends($request->query());

        return view('admin.pets.index', compact('pets'));
    }

    /**
     * Get distinct breeds from database, optionally filtered by species.
     * Returns JSON for AJAX breed dropdown on pets page.
     */
    public function getBreeds(Request $request)
    {
        $query = Pet::select('breed')
            ->whereNotNull('breed')
            ->where('breed', '!=', '');

        if ($request->filled('species')) {
            $query->where('species', $request->species);
        }

        $breeds = $query->distinct()
            ->orderBy('breed')
            ->pluck('breed');

        return response()->json($breeds);
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

        $subscriptionTiers = SubscriptionTier::where('is_active', true)->get();

        // Reviews data for this user (as subject)
        $reviewsAsSubject = \App\Models\UserReview::with(['reviewer', 'ratings'])
            ->where('subject_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $reviewStats = [
            'total' => $reviewsAsSubject->count(),
            'average' => $reviewsAsSubject->avg('average_rating'),
            'positive' => $reviewsAsSubject->where('average_rating', '>=', 4)->count(),
            'negative' => $reviewsAsSubject->where('average_rating', '<=', 2)->count(),
        ];

        // Rating distribution
        $reviewDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $reviewDistribution[$i] = $reviewsAsSubject->filter(function ($r) use ($i) {
                return floor($r->average_rating) == $i;
            })->count();
        }

        // Latest 5 reviews
        $recentReviews = $reviewsAsSubject->take(5);

        return view('admin.users.show', compact('user', 'subscriptionTiers', 'reviewStats', 'reviewDistribution', 'recentReviews'));
    }

    /**
     * Update user subscription tier.
     */
    public function updateUserSubscription(Request $request, $userId)
    {
        $request->validate([
            'tier_slug' => 'required|string|exists:subscription_tiers,slug',
        ]);

        $user = User::findOrFail($userId);
        $oldTier = $user->subscription_tier;

        $user->subscription_tier = $request->tier_slug;
        $user->save();

        AuditLog::log(
            'user.subscription_updated',
            AuditLog::TYPE_UPDATE,
            "User {$user->name} subscription updated from {$oldTier} to {$request->tier_slug}",
            User::class,
            $userId,
            ['subscription_tier' => $oldTier],
            ['subscription_tier' => $request->tier_slug]
        );

        return redirect()->back()->with('success', 'User subscription updated successfully.');
    }

    /**
     * Update user status (suspend/ban).
     * 
     * Suspend = Temporary restriction (requires duration or custom end date).
     * Ban = Permanent restriction (indefinite unless manually lifted).
     */
    public function updateUserStatus(Request $request, $userId)
    {
        $request->validate([
            'status' => 'required|in:active,suspended,banned',
            'suspension_reason' => 'required_if:status,suspended,banned|nullable|string|max:500',
            'suspension_duration' => 'nullable|string|in:1_day,3_days,7_days,30_days,90_days,indefinite,custom',
            'custom_end_date' => 'nullable|date|after:today',
        ]);

        // Enforce reason is truly provided for suspend/ban
        if (in_array($request->status, ['suspended', 'banned']) && empty(trim($request->suspension_reason ?? ''))) {
            return redirect()->back()->with('error', 'Reason is required when suspending or banning a user.');
        }

        $user = User::findOrFail($userId);
        $oldStatus = $user->status ?? 'active';

        $user->status = $request->status;

        if (in_array($request->status, ['suspended', 'banned'])) {
            $user->suspension_reason = $request->suspension_reason;
            $user->suspended_at = now();

            if ($request->status === 'banned') {
                // Ban = permanent by default (no end date)
                $user->suspension_end_date = null;
            } elseif ($request->suspension_duration === 'custom' && $request->custom_end_date) {
                // Custom date selected
                $user->suspension_end_date = Carbon::parse($request->custom_end_date)->endOfDay();
            } elseif ($request->suspension_duration && $request->suspension_duration !== 'indefinite') {
                // Predefined duration
                $days = match ($request->suspension_duration) {
                    '1_day' => 1,
                    '3_days' => 3,
                    '7_days' => 7,
                    '30_days' => 30,
                    '90_days' => 90,
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

            // Send notification
            try {
                $user->notify(new \App\Notifications\UserStatusNotification(
                    $request->status, // 'suspended' or 'banned'
                    $request->suspension_reason,
                    $request->suspension_duration,
                    $user->suspension_end_date
                ));
            } catch (\Exception $e) {
                // Log error but don't fail the request
                \Illuminate\Support\Facades\Log::error("Failed to send suspension notification to User {$user->id}: " . $e->getMessage());
            }
        } else {
            // If reactivating from suspended/banned
            if (in_array($oldStatus, ['suspended', 'banned']) && $request->status === 'active') {
                try {
                    $user->notify(new \App\Notifications\UserStatusNotification('reactivated'));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send reactivation notification to User {$user->id}: " . $e->getMessage());
                }
            }

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
                $days = match ($request->suspension_duration) {
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
        $oldValues = $vaccination->toArray();
        $vaccination->status = $request->status;

        if ($request->status === 'rejected' && $request->rejection_reason) {
            $vaccination->rejection_reason = $request->rejection_reason;
        }

        $vaccination->save();

        AuditLog::log(
            'vaccination.status_updated',
            AuditLog::TYPE_UPDATE,
            "Vaccination status updated to {$request->status} for vaccination #{$vaccination->id}",
            \App\Models\Vaccination::class,
            $vaccination->id,
            $oldValues,
            $vaccination->toArray()
        );

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
        $oldValues = $healthRecord->toArray();
        $healthRecord->status = $request->status;

        if ($request->status === 'rejected' && $request->rejection_reason) {
            $healthRecord->rejection_reason = $request->rejection_reason;
        }

        $healthRecord->save();

        AuditLog::log(
            'health_record.status_updated',
            AuditLog::TYPE_UPDATE,
            "Health certificate status updated to {$request->status} for record #{$healthRecord->id}",
            \App\Models\HealthRecord::class,
            $healthRecord->id,
            $oldValues,
            $healthRecord->toArray()
        );

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

        if ($request->has('export')) {
            $csvColumns = [
                'Date' => function ($row) {
                    return $row->created_at->format('Y-m-d');
                },
                'Requester Pet' => function ($row) {
                    return $row->requesterPet->name ?? 'Unknown';
                },
                'Requester Owner' => function ($row) {
                    return $row->requesterPet->owner->name ?? 'Unknown';
                },
                'Target Pet' => function ($row) {
                    return $row->targetPet->name ?? 'Unknown';
                },
                'Target Owner' => function ($row) {
                    return $row->targetPet->owner->name ?? 'Unknown';
                },
                'Status' => 'status'
            ];
            return $this->export($query->filterByDate($request), $request->export, 'matches_export', 'admin.exports.matches-pdf', [], $csvColumns);
        }

        $perPage = $request->input('per_page', 15);
        $matches = $query->filterByDate($request)->orderBy('created_at', 'desc')->paginate($perPage)->appends($request->query());

        // Get statistics
        $totalMatches = MatchRequest::count();
        $pendingMatches = MatchRequest::where('status', 'pending')->count();
        $acceptedMatches = MatchRequest::where('status', 'accepted')->count();
        $completedMatches = MatchRequest::where('status', 'completed')->count();

        // Date filter "show both" — filtered counts for stat cards
        $hasDateFilter = $request->filled('start_date') && $request->filled('end_date');
        $filteredTotalMatches = null;
        $filteredPendingMatches = null;
        $filteredAcceptedMatches = null;
        $filteredCompletedMatches = null;

        if ($hasDateFilter) {
            $filterStart = Carbon::parse($request->start_date)->startOfDay();
            $filterEnd = Carbon::parse($request->end_date)->endOfDay();
            $filteredTotalMatches = MatchRequest::whereBetween('created_at', [$filterStart, $filterEnd])->count();
            $filteredPendingMatches = MatchRequest::where('status', 'pending')
                ->whereBetween('created_at', [$filterStart, $filterEnd])->count();
            $filteredAcceptedMatches = MatchRequest::where('status', 'accepted')
                ->whereBetween('created_at', [$filterStart, $filterEnd])->count();
            $filteredCompletedMatches = MatchRequest::where('status', 'completed')
                ->whereBetween('created_at', [$filterStart, $filterEnd])->count();
        }

        return view('admin.match-history', compact(
            'matches',
            'totalMatches',
            'pendingMatches',
            'acceptedMatches',
            'completedMatches',
            'hasDateFilter',
            'filteredTotalMatches',
            'filteredPendingMatches',
            'filteredAcceptedMatches',
            'filteredCompletedMatches'
        ));
    }

    /**
     * Display analytics page.
     */
    public function analytics(Request $request)
    {
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();
        $twoMonthsAgo = $now->copy()->subMonths(2);

        // Optional date range for chart filtering
        $chartStart = $request->filled('start_date')
            ? Carbon::parse($request->start_date)->startOfDay()
            : $now->copy()->subYear();
        $chartEnd = $request->filled('end_date')
            ? Carbon::parse($request->end_date)->endOfDay()
            : $now->copy()->endOfDay();

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

        // Monthly data for charts (filtered by date range)
        $monthlyData = User::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as users')
        )
            ->whereBetween('created_at', [$chartStart, $chartEnd])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $monthlyMatches = MatchRequest::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as matches'),
            DB::raw('SUM(CASE WHEN status = "accepted" THEN 1 ELSE 0 END) as accepted')
        )
            ->whereBetween('created_at', [$chartStart, $chartEnd])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Date filter "show both" — filtered counts for stat cards
        $hasDateFilter = $request->filled('start_date') && $request->filled('end_date');
        $filteredRevenue = null;
        $filteredActiveUsers = null;
        $filteredMatches = null;
        $filteredConversionRate = null;

        if ($hasDateFilter) {
            $filteredMatchRevenue = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
                ->where('status', \App\Models\Payment::STATUS_PAID)
                ->whereBetween('paid_at', [$chartStart, $chartEnd])
                ->sum('amount');
            $filteredPremiumSubs = User::where('subscription_tier', 'premium')
                ->whereBetween('created_at', [$chartStart, $chartEnd])->count();
            $filteredStandardSubs = User::where('subscription_tier', 'standard')
                ->whereBetween('created_at', [$chartStart, $chartEnd])->count();
            $filteredRevenue = ($filteredPremiumSubs * $premiumPrice) + ($filteredStandardSubs * $standardPrice) + $filteredMatchRevenue;

            $filteredActiveUsers = User::whereBetween('updated_at', [$chartStart, $chartEnd])->count();

            $filteredAccepted = MatchRequest::where('status', 'accepted')
                ->whereBetween('updated_at', [$chartStart, $chartEnd])->count();
            $filteredMatches = $filteredAccepted;

            $filteredTotalRequests = MatchRequest::whereBetween('created_at', [$chartStart, $chartEnd])->count();
            $filteredConversionRate = $filteredTotalRequests > 0
                ? round(($filteredAccepted / $filteredTotalRequests) * 100, 1)
                : 0;
        }

        // Review analytics
        $totalReviews = \App\Models\UserReview::count();
        $avgPlatformRating = \App\Models\UserReview::whereNotNull('average_rating')->avg('average_rating');
        $reviewsThisMonth = \App\Models\UserReview::where('created_at', '>=', $now->copy()->startOfMonth())->count();
        $reviewsLastMonth = \App\Models\UserReview::whereBetween('created_at', [
            $now->copy()->subMonth()->startOfMonth(),
            $now->copy()->subMonth()->endOfMonth()
        ])->count();
        $reviewGrowth = $reviewsLastMonth > 0
            ? $this->calculateGrowth($reviewsThisMonth, $reviewsLastMonth)
            : ($reviewsThisMonth > 0 ? 100 : 0);

        // Rating distribution for chart
        $ratingDistribution = \App\Models\UserReview::select(
            DB::raw('FLOOR(average_rating) as star_bucket'),
            DB::raw('COUNT(*) as count')
        )
            ->whereNotNull('average_rating')
            ->groupBy('star_bucket')
            ->orderBy('star_bucket')
            ->pluck('count', 'star_bucket')
            ->toArray();

        for ($i = 1; $i <= 5; $i++) {
            if (!isset($ratingDistribution[$i])) {
                $ratingDistribution[$i] = 0;
            }
        }
        ksort($ratingDistribution);

        // Monthly review trend for chart
        $monthlyReviews = \App\Models\UserReview::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as reviews'),
            DB::raw('ROUND(AVG(average_rating), 1) as avg_rating')
        )
            ->whereBetween('created_at', [$chartStart, $chartEnd])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Filtered review count if date filter is active
        $filteredReviews = null;
        if ($hasDateFilter) {
            $filteredReviews = \App\Models\UserReview::whereBetween('created_at', [$chartStart, $chartEnd])->count();
        }

        return view('admin.analytics', compact(
            'totalRevenue',
            'revenueGrowth',
            'activeUsers',
            'activeUsersGrowth',
            'matchesMade',
            'matchesGrowth',
            'conversionRate',
            'conversionGrowth',
            'monthlyData',
            'monthlyMatches',
            'hasDateFilter',
            'filteredRevenue',
            'filteredActiveUsers',
            'filteredMatches',
            'filteredConversionRate',
            'totalReviews',
            'avgPlatformRating',
            'reviewGrowth',
            'ratingDistribution',
            'monthlyReviews',
            'filteredReviews'
        ));
    }

    /**
     * Display billing page.
     */
    public function billing(Request $request)
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
        $matchPaymentQuery = \App\Models\Payment::where('payment_type', \App\Models\Payment::TYPE_MATCH_REQUEST)
            ->where('status', \App\Models\Payment::STATUS_PAID);

        // Apply date range filters
        if ($request->filled('start_date')) {
            $matchPaymentQuery->where('paid_at', '>=', Carbon::parse($request->start_date)->startOfDay());
        }
        if ($request->filled('end_date')) {
            $matchPaymentQuery->where('paid_at', '<=', Carbon::parse($request->end_date)->endOfDay());
        }

        $matchRequestPayments = (clone $matchPaymentQuery)->count();
        $matchRequestRevenue = (clone $matchPaymentQuery)->sum('amount');

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
        $recentSubQuery = User::whereNotNull('subscription_tier')
            ->where('subscription_tier', '!=', 'free');
        if ($request->filled('start_date')) {
            $recentSubQuery->where('updated_at', '>=', Carbon::parse($request->start_date)->startOfDay());
        }
        if ($request->filled('end_date')) {
            $recentSubQuery->where('updated_at', '<=', Carbon::parse($request->end_date)->endOfDay());
        }
        $recentSubscriptions = $recentSubQuery->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get(['id', 'name', 'email', 'subscription_tier', 'updated_at']);

        // Date filter "show both" — filtered counts for stat cards
        $hasDateFilter = $request->filled('start_date') && $request->filled('end_date');
        $filteredFreeUsers = null;
        $filteredStandardUsers = null;
        $filteredPremiumUsers = null;

        if ($hasDateFilter) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            $filteredFreeUsers = User::where(function ($q) {
                $q->where('subscription_tier', 'free')->orWhereNull('subscription_tier');
            })
                ->whereBetween('created_at', [$startDate, $endDate])->count();
            $filteredStandardUsers = User::where('subscription_tier', 'standard')
                ->whereBetween('created_at', [$startDate, $endDate])->count();
            $filteredPremiumUsers = User::where('subscription_tier', 'premium')
                ->whereBetween('created_at', [$startDate, $endDate])->count();
        }

        return view('admin.billing', compact(
            'freeUsers',
            'freePercentage',
            'standardUsers',
            'standardPercentage',
            'standardGrowth',
            'premiumUsers',
            'premiumPercentage',
            'premiumGrowth',
            'totalUsers',
            'recentSubscriptions',
            'matchRequestPayments',
            'matchRequestRevenue',
            'matchRequestGrowth',
            'standardPrice',
            'premiumPrice',
            'matchRequestFee',
            'hasDateFilter',
            'filteredFreeUsers',
            'filteredStandardUsers',
            'filteredPremiumUsers'
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

        if ($request->has('export')) {
            $csvColumns = [
                'ID' => 'id',
                'Reporter' => function ($row) {
                    return $row->reporter->name ?? 'Unknown';
                },
                'Reported User' => function ($row) {
                    return $row->reported->name ?? 'Unknown';
                },
                'Reason' => 'reason',
                'Status' => 'status',
                'Date' => function ($row) {
                    return $row->created_at->format('Y-m-d H:i');
                }
            ];
            return $this->export($query->filterByDate($request), $request->export, 'reports_export', 'admin.exports.reports-pdf', [], $csvColumns);
        }

        $perPage = $request->input('per_page', 15);
        $reports = $query->filterByDate($request)->orderBy('created_at', 'desc')->paginate($perPage)->appends($request->query());

        // Statistics
        $totalReports = SafetyReport::count();
        $pendingReports = SafetyReport::where('status', SafetyReport::STATUS_PENDING)->count();
        $resolvedReports = SafetyReport::where('status', SafetyReport::STATUS_RESOLVED)->count();
        $dismissedReports = SafetyReport::where('status', SafetyReport::STATUS_DISMISSED)->count();

        // Date filter "show both" — filtered counts for stat cards
        $hasDateFilter = $request->filled('start_date') && $request->filled('end_date');
        $filteredTotalReports = null;
        $filteredPendingReports = null;
        $filteredResolvedReports = null;
        $filteredDismissedReports = null;

        if ($hasDateFilter) {
            $filterStart = Carbon::parse($request->start_date)->startOfDay();
            $filterEnd = Carbon::parse($request->end_date)->endOfDay();
            $filteredTotalReports = SafetyReport::whereBetween('created_at', [$filterStart, $filterEnd])->count();
            $filteredPendingReports = SafetyReport::where('status', SafetyReport::STATUS_PENDING)
                ->whereBetween('created_at', [$filterStart, $filterEnd])->count();
            $filteredResolvedReports = SafetyReport::where('status', SafetyReport::STATUS_RESOLVED)
                ->whereBetween('created_at', [$filterStart, $filterEnd])->count();
            $filteredDismissedReports = SafetyReport::where('status', SafetyReport::STATUS_DISMISSED)
                ->whereBetween('created_at', [$filterStart, $filterEnd])->count();
        }

        return view('admin.reports', compact(
            'reports',
            'totalReports',
            'pendingReports',
            'resolvedReports',
            'dismissedReports',
            'hasDateFilter',
            'filteredTotalReports',
            'filteredPendingReports',
            'filteredResolvedReports',
            'filteredDismissedReports'
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

        if ($request->has('export')) {
            $csvColumns = [
                'Date' => function ($row) {
                    return $row->created_at->format('Y-m-d');
                },
                'Blocker' => function ($row) {
                    return $row->blocker->name ?? 'Unknown';
                },
                'Blocked User' => function ($row) {
                    return $row->blocked->name ?? 'Unknown';
                }
            ];
            return $this->export($query->filterByDate($request), $request->export, 'blocks_export', 'admin.exports.blocks-pdf', [], $csvColumns);
        }

        $perPage = $request->input('per_page', 15);
        $blocks = $query->filterByDate($request)->orderBy('created_at', 'desc')->paginate($perPage)->appends($request->query());
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

        // Search by user name, email, or description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->has('export')) {
            $csvColumns = [
                'Date' => function ($row) {
                    return $row->created_at->format('Y-m-d H:i:s');
                },
                'User' => function ($row) {
                    return $row->user->name ?? 'System';
                },
                'Action' => 'action',
                'Description' => 'description',
                'Target Type' => 'target_type',
                'Target ID' => 'target_id'
            ];
            return $this->export($query, $request->export, 'audit_logs_export', 'admin.exports.audit-logs-pdf', [], $csvColumns);
        }

        $perPage = $request->input('per_page', 20);
        $logs = $query->paginate($perPage)->appends($request->query());

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
    public function notifications(Request $request)
    {
        // Date range: default to last 7 days
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::now()->subDays(7);
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now();
        $typeFilter = $request->input('type');

        // Get recent user registrations
        $newUsers = (!$typeFilter || $typeFilter === 'user_registered')
            ? User::whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get(['id', 'name', 'email', 'created_at'])
            : collect();

        // Get pending verifications
        $pendingVerifications = (!$typeFilter || $typeFilter === 'verification_pending')
            ? UserAuth::where('status', 'pending')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            : collect();

        // Get recent match requests
        $recentMatches = (!$typeFilter || $typeFilter === 'match_request')
            ? MatchRequest::whereBetween('created_at', [$startDate, $endDate])
            ->with(['requesterPet:pet_id,name', 'targetPet:pet_id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            : collect();

        // Get recent payments
        $recentPayments = (!$typeFilter || $typeFilter === 'payment_received')
            ? \App\Models\Payment::where('status', \App\Models\Payment::STATUS_PAID)
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->with('user:id,name')
            ->orderBy('paid_at', 'desc')
            ->limit(20)
            ->get()
            : collect();

        // Get pending safety reports
        $pendingReports = (!$typeFilter || $typeFilter === 'safety_report')
            ? SafetyReport::where('status', SafetyReport::STATUS_PENDING)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with(['reporter:id,name', 'reported:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            : collect();

        // Get pending vaccination shots
        $pendingVaccinationShots = (!$typeFilter || $typeFilter === 'vaccination_pending')
            ? \App\Models\VaccinationShot::where('verification_status', 'pending')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with(['card.pet.owner', 'card.protocol'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            : collect();

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
                'url' => route('admin.users.show', $user->id),
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
                'url' => route('admin.users.show', $verification->user->id),
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
                'url' => route('admin.matches'),
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
                'url' => route('admin.billing'),
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
                'url' => route('admin.reports'),
            ]);
        }

        // Add vaccination shot pending notifications
        foreach ($pendingVaccinationShots as $shot) {
            $petName = $shot->card->pet->name ?? 'Unknown pet';
            $protocolName = $shot->card->protocol->name ?? 'vaccine';
            $ownerName = $shot->card->pet->owner->name ?? 'Unknown owner';
            $notifications->push([
                'type' => 'vaccination_pending',
                'icon' => 'syringe',
                'color' => 'yellow',
                'title' => 'Vaccination proof awaiting review',
                'message' => "{$ownerName} submitted {$protocolName} proof for {$petName}",
                'created_at' => $shot->created_at,
                'is_unread' => true,
                'url' => route('admin.vaccination-shots.pending'),
            ]);
        }

        // Sort by created_at descending
        $notifications = $notifications->sortByDesc('created_at')->take(30)->values();

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
        $oldValues = $user->toArray();
        $user->update($request->only(['name', 'firstName', 'lastName', 'email', 'contact_number']));

        AuditLog::log(
            'admin.profile_updated',
            AuditLog::TYPE_UPDATE,
            "Admin {$user->name} updated their profile",
            User::class,
            $user->id,
            $oldValues,
            $user->toArray()
        );

        return redirect()->back()->with('success', 'Profile updated successfully.');
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

        if ($request->status === 'approved') {
            $this->assignRoleForApprovedVerification($userAuth);
        }

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
     * Attach breeder/shooter role when the corresponding certificate is approved.
     */
    private function assignRoleForApprovedVerification(UserAuth $userAuth): void
    {
        $roleType = match ($userAuth->auth_type) {
            'breeder_certificate' => 'Breeder',
            'shooter_certificate' => 'Shooter',
            default => null,
        };

        if (!$roleType) {
            return;
        }

        $role = Role::where('role_type', $roleType)->first();
        $user = $userAuth->user;

        if (!$role || !$user) {
            return;
        }

        $alreadyHasRole = $user->roles()
            ->where('roles.role_id', $role->role_id)
            ->exists();

        if (!$alreadyHasRole) {
            $user->roles()->attach($role->role_id);
        }
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

        // Return JSON for AJAX requests, redirect for form submissions
        if (request()->ajax() || request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'User account deleted successfully'
            ]);
        }

        return redirect()->route('admin.users.index')->with('success', 'User account deleted successfully.');
    }
}
