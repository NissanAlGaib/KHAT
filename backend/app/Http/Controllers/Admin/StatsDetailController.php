<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Pet;
use App\Models\MatchRequest;
use App\Models\SafetyReport;
use App\Models\Payment;
use App\Models\PoolTransaction;
use App\Models\Dispute;
use App\Models\UserAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatsDetailController extends Controller
{
    /**
     * Return JSON detail for a stat card modal.
     * GET /admin/stats/detail/{type}?start_date=&end_date=
     */
    public function show(Request $request, string $type)
    {
        $startDate = $request->filled('start_date') ? Carbon::parse($request->start_date)->startOfDay() : null;
        $endDate = $request->filled('end_date') ? Carbon::parse($request->end_date)->endOfDay() : null;

        $handler = 'detail' . str_replace(' ', '', ucwords(str_replace('_', ' ', $type)));

        if (!method_exists($this, $handler)) {
            return response()->json(['error' => 'Unknown stat type'], 404);
        }

        return response()->json($this->$handler($startDate, $endDate));
    }

    // ─── DASHBOARD CARDS ─────────────────────────────────────────

    private function detailTotalUsers(?Carbon $start, ?Carbon $end): array
    {
        $query = User::query();
        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $breederIds = UserAuth::where('auth_type', 'breeder_certificate')
            ->where('status', 'approved')->pluck('user_id');
        $shooterIds = UserAuth::where('auth_type', 'shooter_certificate')
            ->where('status', 'approved')->pluck('user_id');

        $users = $query->orderBy('created_at', 'desc')->limit(15)->get(['id', 'name', 'email', 'created_at', 'subscription_tier']);

        $breeders = $breederIds->count();
        $shooters = $shooterIds->count();
        $regular = User::count() - $breeders - $shooters;

        $rowColors = [];
        $records = $users->map(function ($u) use ($breederIds, $shooterIds, &$rowColors) {
            if ($breederIds->contains($u->id)) {
                $role = 'Breeder';
                $rowColors[] = 'green';
            } elseif ($shooterIds->contains($u->id)) {
                $role = 'Shooter';
                $rowColors[] = 'emerald';
            } else {
                $role = 'Regular';
                $rowColors[] = 'blue';
            }
            return [
                $u->name ?? 'N/A',
                $u->email,
                $u->created_at->format('M d, Y'),
                $role,
            ];
        })->values();

        return [
            'title' => 'Total Users',
            'breakdown' => [
                ['label' => 'Verified Breeders', 'count' => $breeders, 'color' => 'green'],
                ['label' => 'Verified Shooters', 'count' => $shooters, 'color' => 'emerald'],
                ['label' => 'Regular Users', 'count' => max(0, $regular), 'color' => 'blue'],
            ],
            'columns' => ['Name', 'Email', 'Joined', 'Role'],
            'colorColumn' => 3,
            'rowColors' => $rowColors,
            'records' => $records,
        ];
    }

    private function detailVerifiedBreeders(?Carbon $start, ?Carbon $end): array
    {
        $query = UserAuth::where('auth_type', 'breeder_certificate')
            ->where('status', 'approved')
            ->with('user:id,name,email');

        if ($start && $end) {
            $query->whereBetween('updated_at', [$start, $end]);
        }

        $records = $query->orderBy('updated_at', 'desc')->limit(15)->get();

        // Breakdown by month approved
        $thisMonth = $records->filter(fn($r) => $r->updated_at->isCurrentMonth())->count();
        $lastMonth = $records->filter(fn($r) => $r->updated_at->isLastMonth())->count();
        $older = $records->count() - $thisMonth - $lastMonth;

        return [
            'title' => 'Verified Breeders',
            'breakdown' => [
                ['label' => 'Approved this month', 'count' => $thisMonth, 'color' => 'green'],
                ['label' => 'Approved last month', 'count' => $lastMonth, 'color' => 'blue'],
                ['label' => 'Earlier', 'count' => max(0, $older), 'color' => 'gray'],
            ],
            'columns' => ['Name', 'Email', 'Approved On'],
            'records' => $records->map(fn($r) => [
                $r->user->name ?? 'N/A',
                $r->user->email ?? 'N/A',
                $r->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailVerifiedShooters(?Carbon $start, ?Carbon $end): array
    {
        $query = UserAuth::where('auth_type', 'shooter_certificate')
            ->where('status', 'approved')
            ->with('user:id,name,email');

        if ($start && $end) {
            $query->whereBetween('updated_at', [$start, $end]);
        }

        $records = $query->orderBy('updated_at', 'desc')->limit(15)->get();

        $thisMonth = $records->filter(fn($r) => $r->updated_at->isCurrentMonth())->count();
        $lastMonth = $records->filter(fn($r) => $r->updated_at->isLastMonth())->count();
        $older = $records->count() - $thisMonth - $lastMonth;

        return [
            'title' => 'Verified Shooters',
            'breakdown' => [
                ['label' => 'Approved this month', 'count' => $thisMonth, 'color' => 'green'],
                ['label' => 'Approved last month', 'count' => $lastMonth, 'color' => 'blue'],
                ['label' => 'Earlier', 'count' => max(0, $older), 'color' => 'gray'],
            ],
            'columns' => ['Name', 'Email', 'Approved On'],
            'records' => $records->map(fn($r) => [
                $r->user->name ?? 'N/A',
                $r->user->email ?? 'N/A',
                $r->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailActivePets(?Carbon $start, ?Carbon $end): array
    {
        $query = Pet::where('status', 'active')->with('owner:id,name');

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $pets = $query->orderBy('created_at', 'desc')->limit(15)->get();

        $dogs = Pet::where('status', 'active')->where('species', 'dog')->count();
        $cats = Pet::where('status', 'active')->where('species', 'cat')->count();

        $rowColors = $pets->map(fn($p) => strtolower($p->species ?? '') === 'dog' ? 'amber' : 'purple')->values()->toArray();

        return [
            'title' => 'Active Pets',
            'breakdown' => [
                ['label' => 'Dogs', 'count' => $dogs, 'color' => 'amber'],
                ['label' => 'Cats', 'count' => $cats, 'color' => 'purple'],
            ],
            'columns' => ['Name', 'Species', 'Breed', 'Owner'],
            'colorColumn' => 1,
            'rowColors' => $rowColors,
            'records' => $pets->map(fn($p) => [
                $p->name,
                ucfirst($p->species ?? 'N/A'),
                $p->breed ?? 'N/A',
                $p->owner->name ?? 'N/A',
            ])->values(),
        ];
    }

    private function detailDisabledPets(?Carbon $start, ?Carbon $end): array
    {
        $query = Pet::where('status', 'disabled')->with('owner:id,name');

        if ($start && $end) {
            $query->whereBetween('updated_at', [$start, $end]);
        }

        $pets = $query->orderBy('updated_at', 'desc')->limit(15)->get();

        $dogs = Pet::where('status', 'disabled')->where('species', 'dog')->count();
        $cats = Pet::where('status', 'disabled')->where('species', 'cat')->count();

        $rowColors = $pets->map(fn($p) => strtolower($p->species ?? '') === 'dog' ? 'red' : 'orange')->values()->toArray();

        return [
            'title' => 'Disabled Pets',
            'breakdown' => [
                ['label' => 'Dogs', 'count' => $dogs, 'color' => 'red'],
                ['label' => 'Cats', 'count' => $cats, 'color' => 'orange'],
            ],
            'columns' => ['Name', 'Species', 'Owner', 'Disabled On'],
            'colorColumn' => 1,
            'rowColors' => $rowColors,
            'records' => $pets->map(fn($p) => [
                $p->name,
                ucfirst($p->species ?? 'N/A'),
                $p->owner->name ?? 'N/A',
                $p->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailCooldownPets(?Carbon $start, ?Carbon $end): array
    {
        $query = Pet::onCooldown()->with('owner:id,name');

        $pets = $query->orderBy('cooldown_until', 'asc')->limit(15)->get();

        $dogs = Pet::onCooldown()->where('species', 'dog')->count();
        $cats = Pet::onCooldown()->where('species', 'cat')->count();

        $rowColors = $pets->map(fn($p) => strtolower($p->species ?? '') === 'dog' ? 'sky' : 'violet')->values()->toArray();

        return [
            'title' => 'Cooldown Pets',
            'breakdown' => [
                ['label' => 'Dogs', 'count' => $dogs, 'color' => 'sky'],
                ['label' => 'Cats', 'count' => $cats, 'color' => 'violet'],
            ],
            'columns' => ['Name', 'Species', 'Owner', 'Cooldown Until'],
            'colorColumn' => 1,
            'rowColors' => $rowColors,
            'records' => $pets->map(fn($p) => [
                $p->name,
                ucfirst($p->species ?? 'N/A'),
                $p->owner->name ?? 'N/A',
                $p->cooldown_until ? Carbon::parse($p->cooldown_until)->format('M d, Y') : 'N/A',
            ])->values(),
        ];
    }

    private function detailStandardSubscribers(?Carbon $start, ?Carbon $end): array
    {
        $query = User::where('subscription_tier', 'standard');

        if ($start && $end) {
            $query->whereBetween('updated_at', [$start, $end]);
        }

        $users = $query->orderBy('updated_at', 'desc')->limit(15)->get(['id', 'name', 'email', 'updated_at', 'created_at']);

        return [
            'title' => 'Standard Subscribers',
            'breakdown' => [
                ['label' => 'Total Standard', 'count' => User::where('subscription_tier', 'standard')->count(), 'color' => 'purple'],
                ['label' => 'Subscribed this month', 'count' => User::where('subscription_tier', 'standard')->where('updated_at', '>=', Carbon::now()->startOfMonth())->count(), 'color' => 'blue'],
            ],
            'columns' => ['Name', 'Email', 'Subscribed On'],
            'records' => $users->map(fn($u) => [
                $u->name ?? 'N/A',
                $u->email,
                $u->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailPremiumSubscribers(?Carbon $start, ?Carbon $end): array
    {
        $query = User::where('subscription_tier', 'premium');

        if ($start && $end) {
            $query->whereBetween('updated_at', [$start, $end]);
        }

        $users = $query->orderBy('updated_at', 'desc')->limit(15)->get(['id', 'name', 'email', 'updated_at', 'created_at']);

        return [
            'title' => 'Premium Subscribers',
            'breakdown' => [
                ['label' => 'Total Premium', 'count' => User::where('subscription_tier', 'premium')->count(), 'color' => 'orange'],
                ['label' => 'Subscribed this month', 'count' => User::where('subscription_tier', 'premium')->where('updated_at', '>=', Carbon::now()->startOfMonth())->count(), 'color' => 'amber'],
            ],
            'columns' => ['Name', 'Email', 'Subscribed On'],
            'records' => $users->map(fn($u) => [
                $u->name ?? 'N/A',
                $u->email,
                $u->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    // ─── ANALYTICS CARDS ─────────────────────────────────────────

    private function detailTotalRevenue(?Carbon $start, ?Carbon $end): array
    {
        $matchQuery = Payment::where('payment_type', Payment::TYPE_MATCH_REQUEST)
            ->where('status', Payment::STATUS_PAID);

        if ($start && $end) {
            $matchQuery->whereBetween('paid_at', [$start, $end]);
        }

        $matchRevenue = (clone $matchQuery)->sum('amount');
        $matchCount = (clone $matchQuery)->count();
        $recentPayments = (clone $matchQuery)->with('user:id,name')->orderBy('paid_at', 'desc')->limit(15)->get();

        $standardCount = User::where('subscription_tier', 'standard')->count();
        $premiumCount = User::where('subscription_tier', 'premium')->count();
        $subRevenue = ($standardCount * 199) + ($premiumCount * 499);

        return [
            'title' => 'Total Revenue',
            'breakdown' => [
                ['label' => 'Match Request Fees', 'count' => '₱' . number_format($matchRevenue, 2), 'color' => 'green'],
                ['label' => 'Subscription Revenue', 'count' => '₱' . number_format($subRevenue, 2), 'color' => 'blue'],
                ['label' => 'Total Match Payments', 'count' => $matchCount . ' payments', 'color' => 'gray'],
            ],
            'columns' => ['User', 'Amount', 'Paid On'],
            'records' => $recentPayments->map(fn($p) => [
                $p->user->name ?? 'N/A',
                '₱' . number_format($p->amount, 2),
                $p->paid_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailActiveUsers(?Carbon $start, ?Carbon $end): array
    {
        $lastMonth = Carbon::now()->subMonth();
        $query = User::where('updated_at', '>=', $lastMonth);

        if ($start && $end) {
            $query = User::whereBetween('updated_at', [$start, $end]);
        }

        $users = $query->orderBy('updated_at', 'desc')->limit(15)->get(['id', 'name', 'email', 'updated_at', 'subscription_tier']);

        $breederIds = UserAuth::where('auth_type', 'breeder_certificate')->where('status', 'approved')->pluck('user_id');
        $shooterIds = UserAuth::where('auth_type', 'shooter_certificate')->where('status', 'approved')->pluck('user_id');

        $activeBreederCount = (clone $query)->whereIn('id', $breederIds)->count();
        $activeShooterCount = (clone $query)->whereIn('id', $shooterIds)->count();
        $totalActive = (clone $query)->count();
        $otherCount = $totalActive - $activeBreederCount - $activeShooterCount;

        $rowColors = [];
        $records = $users->map(function ($u) use ($breederIds, $shooterIds, &$rowColors) {
            if ($breederIds->contains($u->id)) {
                $role = 'Breeder';
                $rowColors[] = 'green';
            } elseif ($shooterIds->contains($u->id)) {
                $role = 'Shooter';
                $rowColors[] = 'emerald';
            } else {
                $role = 'Regular';
                $rowColors[] = 'blue';
            }
            return [
                $u->name ?? 'N/A',
                $u->email,
                $u->updated_at->format('M d, Y'),
                $role,
            ];
        })->values();

        return [
            'title' => 'Active Users',
            'breakdown' => [
                ['label' => 'Active Breeders', 'count' => $activeBreederCount, 'color' => 'green'],
                ['label' => 'Active Shooters', 'count' => $activeShooterCount, 'color' => 'emerald'],
                ['label' => 'Other Active', 'count' => max(0, $otherCount), 'color' => 'blue'],
            ],
            'columns' => ['Name', 'Email', 'Last Active', 'Role'],
            'colorColumn' => 3,
            'rowColors' => $rowColors,
            'records' => $records,
        ];
    }

    private function detailMatchesMade(?Carbon $start, ?Carbon $end): array
    {
        $query = MatchRequest::where('status', 'accepted')
            ->with(['requesterPet:pet_id,name', 'targetPet:pet_id,name']);

        if ($start && $end) {
            $query->whereBetween('updated_at', [$start, $end]);
        }

        $matches = $query->orderBy('updated_at', 'desc')->limit(15)->get();

        $pending = MatchRequest::where('status', 'pending')->count();
        $accepted = MatchRequest::where('status', 'accepted')->count();
        $declined = MatchRequest::where('status', 'declined')->count();
        $completed = MatchRequest::where('status', 'completed')->count();

        return [
            'title' => 'Matches Made',
            'breakdown' => [
                ['label' => 'Accepted', 'count' => $accepted, 'color' => 'green'],
                ['label' => 'Pending', 'count' => $pending, 'color' => 'yellow'],
                ['label' => 'Declined', 'count' => $declined, 'color' => 'red'],
                ['label' => 'Completed', 'count' => $completed, 'color' => 'blue'],
            ],
            'columns' => ['Requester Pet', 'Target Pet', 'Matched On'],
            'records' => $matches->map(fn($m) => [
                $m->requesterPet->name ?? 'Unknown',
                $m->targetPet->name ?? 'Unknown',
                $m->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailConversionRate(?Carbon $start, ?Carbon $end): array
    {
        $totalQuery = MatchRequest::query();
        $acceptedQuery = MatchRequest::where('status', 'accepted');

        if ($start && $end) {
            $totalQuery->whereBetween('created_at', [$start, $end]);
            $acceptedQuery->whereBetween('created_at', [$start, $end]);
        }

        $total = $totalQuery->count();
        $accepted = $acceptedQuery->count();
        $declined = MatchRequest::where('status', 'declined');
        $pending = MatchRequest::where('status', 'pending');
        if ($start && $end) {
            $declined->whereBetween('created_at', [$start, $end]);
            $pending->whereBetween('created_at', [$start, $end]);
        }

        return [
            'title' => 'Conversion Rate',
            'breakdown' => [
                ['label' => 'Total Requests', 'count' => $total, 'color' => 'blue'],
                ['label' => 'Accepted', 'count' => $accepted, 'color' => 'green'],
                ['label' => 'Declined', 'count' => $declined->count(), 'color' => 'red'],
                ['label' => 'Pending', 'count' => $pending->count(), 'color' => 'yellow'],
            ],
            'columns' => [],
            'records' => [],
        ];
    }

    // ─── BILLING CARDS ───────────────────────────────────────────

    private function detailFreeUsers(?Carbon $start, ?Carbon $end): array
    {
        $query = User::where(function ($q) {
            $q->where('subscription_tier', 'free')->orWhereNull('subscription_tier');
        });

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $users = $query->orderBy('created_at', 'desc')->limit(15)->get(['id', 'name', 'email', 'created_at']);

        $total = User::count();
        $free = User::where('subscription_tier', 'free')->orWhereNull('subscription_tier')->count();
        $standard = User::where('subscription_tier', 'standard')->count();
        $premium = User::where('subscription_tier', 'premium')->count();

        return [
            'title' => 'Free Tier Users',
            'breakdown' => [
                ['label' => 'Free', 'count' => $free, 'color' => 'gray'],
                ['label' => 'Standard', 'count' => $standard, 'color' => 'purple'],
                ['label' => 'Premium', 'count' => $premium, 'color' => 'orange'],
            ],
            'columns' => ['Name', 'Email', 'Joined'],
            'records' => $users->map(fn($u) => [
                $u->name ?? 'N/A',
                $u->email,
                $u->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailMatchPayments(?Carbon $start, ?Carbon $end): array
    {
        $query = Payment::where('payment_type', Payment::TYPE_MATCH_REQUEST)
            ->where('status', Payment::STATUS_PAID)
            ->with('user:id,name');

        if ($start && $end) {
            $query->whereBetween('paid_at', [$start, $end]);
        }

        $payments = $query->orderBy('paid_at', 'desc')->limit(15)->get();
        $totalAmount = (clone $query)->sum('amount');

        return [
            'title' => 'Match Request Payments',
            'breakdown' => [
                ['label' => 'Total Payments', 'count' => $payments->count(), 'color' => 'green'],
                ['label' => 'Total Revenue', 'count' => '₱' . number_format($totalAmount, 2), 'color' => 'blue'],
            ],
            'columns' => ['User', 'Amount', 'Paid On'],
            'records' => $payments->map(fn($p) => [
                $p->user->name ?? 'N/A',
                '₱' . number_format($p->amount, 2),
                $p->paid_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailStandardBilling(?Carbon $start, ?Carbon $end): array
    {
        return $this->detailStandardSubscribers($start, $end);
    }

    private function detailPremiumBilling(?Carbon $start, ?Carbon $end): array
    {
        return $this->detailPremiumSubscribers($start, $end);
    }

    // ─── POOL CARDS ──────────────────────────────────────────────

    private function detailPoolBalance(?Carbon $start, ?Carbon $end): array
    {
        $deposits = PoolTransaction::where('type', 'deposit')->where('status', 'completed')->sum('amount');
        $releases = PoolTransaction::where('type', 'release')->where('status', 'completed')->sum('amount');
        $fees = PoolTransaction::where('type', 'fee')->where('status', 'completed')->sum('amount');
        $refunds = PoolTransaction::where('type', 'refund')->where('status', 'completed')->sum('amount');

        $recent = PoolTransaction::with('user:id,name')->orderBy('created_at', 'desc')->limit(15)->get();

        $typeColorMap = ['deposit' => 'green', 'release' => 'blue', 'fee' => 'amber', 'refund' => 'red'];
        $rowColors = $recent->map(fn($t) => $typeColorMap[$t->type] ?? 'gray')->values()->toArray();

        return [
            'title' => 'Pool Balance',
            'breakdown' => [
                ['label' => 'Total Deposits', 'count' => '₱' . number_format($deposits, 2), 'color' => 'green'],
                ['label' => 'Total Releases', 'count' => '₱' . number_format($releases, 2), 'color' => 'blue'],
                ['label' => 'Fees Collected', 'count' => '₱' . number_format($fees, 2), 'color' => 'amber'],
                ['label' => 'Refunds', 'count' => '₱' . number_format($refunds, 2), 'color' => 'red'],
            ],
            'columns' => ['User', 'Type', 'Amount', 'Date'],
            'colorColumn' => 1,
            'rowColors' => $rowColors,
            'records' => $recent->map(fn($t) => [
                $t->user->name ?? 'System',
                ucfirst($t->type),
                '₱' . number_format($t->amount, 2),
                $t->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailPoolDeposited(?Carbon $start, ?Carbon $end): array
    {
        $query = PoolTransaction::where('type', 'deposit')->where('status', 'completed')->with('user:id,name');

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $records = $query->orderBy('created_at', 'desc')->limit(15)->get();
        $total = (clone $query)->sum('amount');

        return [
            'title' => 'Total Deposited',
            'breakdown' => [
                ['label' => 'Total Amount', 'count' => '₱' . number_format($total, 2), 'color' => 'green'],
                ['label' => 'Transactions', 'count' => (clone $query)->count(), 'color' => 'blue'],
            ],
            'columns' => ['User', 'Amount', 'Date'],
            'records' => $records->map(fn($t) => [
                $t->user->name ?? 'System',
                '₱' . number_format($t->amount, 2),
                $t->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailPoolReleased(?Carbon $start, ?Carbon $end): array
    {
        $query = PoolTransaction::where('type', 'release')->where('status', 'completed')->with('user:id,name');

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $records = $query->orderBy('created_at', 'desc')->limit(15)->get();
        $total = (clone $query)->sum('amount');

        return [
            'title' => 'Total Released',
            'breakdown' => [
                ['label' => 'Total Amount', 'count' => '₱' . number_format($total, 2), 'color' => 'blue'],
                ['label' => 'Transactions', 'count' => (clone $query)->count(), 'color' => 'green'],
            ],
            'columns' => ['User', 'Amount', 'Date'],
            'records' => $records->map(fn($t) => [
                $t->user->name ?? 'System',
                '₱' . number_format($t->amount, 2),
                $t->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailPoolFrozen(?Carbon $start, ?Carbon $end): array
    {
        $frozenTx = PoolTransaction::where('status', 'frozen')->with('user:id,name');

        $records = $frozenTx->orderBy('created_at', 'desc')->limit(15)->get();
        $totalFrozen = (clone $frozenTx)->sum('amount');
        $openDisputes = Dispute::active()->count();

        return [
            'title' => 'Frozen Funds',
            'breakdown' => [
                ['label' => 'Frozen Amount', 'count' => '₱' . number_format($totalFrozen, 2), 'color' => 'red'],
                ['label' => 'Open Disputes', 'count' => $openDisputes, 'color' => 'yellow'],
            ],
            'columns' => ['User', 'Amount', 'Date'],
            'records' => $records->map(fn($t) => [
                $t->user->name ?? 'System',
                '₱' . number_format($t->amount, 2),
                $t->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    // ─── REPORTS CARDS ───────────────────────────────────────────

    private function detailTotalReports(?Carbon $start, ?Carbon $end): array
    {
        $query = SafetyReport::with(['reporter:id,name', 'reported:id,name']);

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $reports = $query->orderBy('created_at', 'desc')->limit(15)->get();

        $pending = SafetyReport::where('status', SafetyReport::STATUS_PENDING)->count();
        $resolved = SafetyReport::where('status', SafetyReport::STATUS_RESOLVED)->count();
        $dismissed = SafetyReport::where('status', SafetyReport::STATUS_DISMISSED)->count();

        $statusColorMap = [SafetyReport::STATUS_PENDING => 'yellow', SafetyReport::STATUS_RESOLVED => 'green', SafetyReport::STATUS_DISMISSED => 'gray'];
        $rowColors = $reports->map(fn($r) => $statusColorMap[$r->status] ?? 'gray')->values()->toArray();

        return [
            'title' => 'Total Reports',
            'breakdown' => [
                ['label' => 'Pending', 'count' => $pending, 'color' => 'yellow'],
                ['label' => 'Resolved', 'count' => $resolved, 'color' => 'green'],
                ['label' => 'Dismissed', 'count' => $dismissed, 'color' => 'gray'],
            ],
            'columns' => ['Reporter', 'Reported', 'Reason', 'Status', 'Date'],
            'colorColumn' => 3,
            'rowColors' => $rowColors,
            'records' => $reports->map(fn($r) => [
                $r->reporter->name ?? 'N/A',
                $r->reported->name ?? 'N/A',
                ucfirst(str_replace('_', ' ', $r->reason ?? 'N/A')),
                ucfirst($r->status),
                $r->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailPendingReports(?Carbon $start, ?Carbon $end): array
    {
        $query = SafetyReport::where('status', SafetyReport::STATUS_PENDING)
            ->with(['reporter:id,name', 'reported:id,name']);

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $reports = $query->orderBy('created_at', 'desc')->limit(15)->get();

        return [
            'title' => 'Pending Reports',
            'breakdown' => [
                ['label' => 'Awaiting Review', 'count' => $reports->count(), 'color' => 'yellow'],
            ],
            'columns' => ['Reporter', 'Reported', 'Reason', 'Date'],
            'records' => $reports->map(fn($r) => [
                $r->reporter->name ?? 'N/A',
                $r->reported->name ?? 'N/A',
                ucfirst(str_replace('_', ' ', $r->reason ?? 'N/A')),
                $r->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailResolvedReports(?Carbon $start, ?Carbon $end): array
    {
        $query = SafetyReport::where('status', SafetyReport::STATUS_RESOLVED)
            ->with(['reporter:id,name', 'reported:id,name']);

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $reports = $query->orderBy('updated_at', 'desc')->limit(15)->get();

        return [
            'title' => 'Resolved Reports',
            'breakdown' => [
                ['label' => 'Total Resolved', 'count' => SafetyReport::where('status', SafetyReport::STATUS_RESOLVED)->count(), 'color' => 'green'],
            ],
            'columns' => ['Reporter', 'Reported', 'Reason', 'Resolved On'],
            'records' => $reports->map(fn($r) => [
                $r->reporter->name ?? 'N/A',
                $r->reported->name ?? 'N/A',
                ucfirst(str_replace('_', ' ', $r->reason ?? 'N/A')),
                $r->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailDismissedReports(?Carbon $start, ?Carbon $end): array
    {
        $query = SafetyReport::where('status', SafetyReport::STATUS_DISMISSED)
            ->with(['reporter:id,name', 'reported:id,name']);

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $reports = $query->orderBy('updated_at', 'desc')->limit(15)->get();

        return [
            'title' => 'Dismissed Reports',
            'breakdown' => [
                ['label' => 'Total Dismissed', 'count' => SafetyReport::where('status', SafetyReport::STATUS_DISMISSED)->count(), 'color' => 'gray'],
            ],
            'columns' => ['Reporter', 'Reported', 'Reason', 'Dismissed On'],
            'records' => $reports->map(fn($r) => [
                $r->reporter->name ?? 'N/A',
                $r->reported->name ?? 'N/A',
                ucfirst(str_replace('_', ' ', $r->reason ?? 'N/A')),
                $r->updated_at->format('M d, Y'),
            ])->values(),
        ];
    }

    // ─── MATCH HISTORY CARDS ─────────────────────────────────────

    private function detailTotalMatches(?Carbon $start, ?Carbon $end): array
    {
        $query = MatchRequest::with(['requesterPet:pet_id,name', 'targetPet:pet_id,name']);

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $matches = $query->orderBy('created_at', 'desc')->limit(15)->get();

        $pending = MatchRequest::where('status', 'pending')->count();
        $accepted = MatchRequest::where('status', 'accepted')->count();
        $declined = MatchRequest::where('status', 'declined')->count();
        $completed = MatchRequest::where('status', 'completed')->count();

        $matchColorMap = ['pending' => 'yellow', 'accepted' => 'green', 'declined' => 'red', 'completed' => 'blue'];
        $rowColors = $matches->map(fn($m) => $matchColorMap[$m->status] ?? 'gray')->values()->toArray();

        return [
            'title' => 'Total Matches',
            'breakdown' => [
                ['label' => 'Pending', 'count' => $pending, 'color' => 'yellow'],
                ['label' => 'Accepted', 'count' => $accepted, 'color' => 'green'],
                ['label' => 'Declined', 'count' => $declined, 'color' => 'red'],
                ['label' => 'Completed', 'count' => $completed, 'color' => 'blue'],
            ],
            'columns' => ['Requester Pet', 'Target Pet', 'Status', 'Date'],
            'colorColumn' => 2,
            'rowColors' => $rowColors,
            'records' => $matches->map(fn($m) => [
                $m->requesterPet->name ?? 'Unknown',
                $m->targetPet->name ?? 'Unknown',
                ucfirst($m->status),
                $m->created_at->format('M d, Y'),
            ])->values(),
        ];
    }

    private function detailPendingMatches(?Carbon $start, ?Carbon $end): array
    {
        return $this->matchesByStatus('pending', 'Pending Matches', 'yellow', $start, $end);
    }

    private function detailAcceptedMatches(?Carbon $start, ?Carbon $end): array
    {
        return $this->matchesByStatus('accepted', 'Accepted Matches', 'green', $start, $end);
    }

    private function detailCompletedMatches(?Carbon $start, ?Carbon $end): array
    {
        return $this->matchesByStatus('completed', 'Completed Matches', 'blue', $start, $end);
    }

    private function matchesByStatus(string $status, string $title, string $color, ?Carbon $start, ?Carbon $end): array
    {
        $query = MatchRequest::where('status', $status)
            ->with(['requesterPet:pet_id,name', 'targetPet:pet_id,name']);

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        $matches = $query->orderBy('created_at', 'desc')->limit(15)->get();

        return [
            'title' => $title,
            'breakdown' => [
                ['label' => ucfirst($status) . ' Total', 'count' => MatchRequest::where('status', $status)->count(), 'color' => $color],
            ],
            'columns' => ['Requester Pet', 'Target Pet', 'Date'],
            'records' => $matches->map(fn($m) => [
                $m->requesterPet->name ?? 'Unknown',
                $m->targetPet->name ?? 'Unknown',
                $m->created_at->format('M d, Y'),
            ])->values(),
        ];
    }
}
