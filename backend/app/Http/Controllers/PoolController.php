<?php

namespace App\Http\Controllers;

use App\Models\BreedingContract;
use App\Models\Payment;
use App\Models\Pet;
use App\Models\PoolTransaction;
use App\Services\PoolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PoolController extends Controller
{
    private PoolService $poolService;

    public function __construct(PoolService $poolService)
    {
        $this->poolService = $poolService;
    }

    /**
     * Get the authenticated user's pool transactions (paginated).
     * GET /api/pool/my-transactions
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = PoolTransaction::where('user_id', $user->id)
            ->with(['payment:id,payment_type,amount,status', 'contract:id,status,breeding_status']);

        // Filter by type
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('from') && $request->from) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->has('to') && $request->to) {
            $query->where('created_at', '<=', $request->to);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }

    /**
     * Get pool summary for a specific contract.
     * GET /api/pool/contracts/{contractId}/summary
     */
    public function contractSummary(Request $request, int $contractId): JsonResponse
    {
        $user = $request->user();

        // Verify access
        $contract = BreedingContract::findAccessibleByUser($contractId, $user->id);

        if (! $contract) {
            // Also check if user is the shooter
            $contract = BreedingContract::where('id', $contractId)
                ->where('shooter_user_id', $user->id)
                ->first();
        }

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or access denied',
            ], 404);
        }

        $summary = $this->poolService->getContractPoolSummary($contract);

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get user's total pool balance (funds currently held).
     * GET /api/pool/balance
     */
    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();

        $heldBalance = PoolTransaction::where('user_id', $user->id)
            ->deposits()
            ->whereIn('status', [PoolTransaction::STATUS_COMPLETED, PoolTransaction::STATUS_FROZEN])
            ->sum('amount');

        $releasedBalance = PoolTransaction::where('user_id', $user->id)
            ->whereIn('type', [PoolTransaction::TYPE_RELEASE, PoolTransaction::TYPE_REFUND])
            ->where('status', PoolTransaction::STATUS_COMPLETED)
            ->sum('amount');

        $frozenBalance = PoolTransaction::where('user_id', $user->id)
            ->where('status', PoolTransaction::STATUS_FROZEN)
            ->sum('amount');

        $pendingDeposits = Payment::where('user_id', $user->id)
            ->whereIn('payment_type', [
                Payment::TYPE_COLLATERAL,
                Payment::TYPE_SHOOTER_COLLATERAL,
                Payment::TYPE_SHOOTER_PAYMENT,
                Payment::TYPE_MONETARY_COMPENSATION,
            ])
            ->whereIn('status', [Payment::STATUS_PENDING, Payment::STATUS_AWAITING_PAYMENT])
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'held' => (float) $heldBalance - (float) $releasedBalance,
                'frozen' => (float) $frozenBalance,
                'pending_deposits' => (float) $pendingDeposits,
                'total_deposited' => (float) $heldBalance,
                'total_released' => (float) $releasedBalance,
            ],
        ]);
    }
}
