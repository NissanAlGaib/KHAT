<?php

namespace App\Http\Controllers;

use App\Models\BreedingContract;
use App\Models\Dispute;
use App\Services\PoolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DisputeController extends Controller
{
    private PoolService $poolService;

    public function __construct(PoolService $poolService)
    {
        $this->poolService = $poolService;
    }

    /**
     * Create a new dispute for a contract.
     * POST /api/disputes
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contract_id' => 'required|integer|exists:breeding_contracts,id',
            'reason' => 'required|string|min:10|max:2000',
        ]);

        $user = $request->user();
        $contractId = $validated['contract_id'];

        // Verify user is party to the contract
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
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        // Contract must be accepted or fulfilled to dispute
        if (! in_array($contract->status, ['accepted', 'fulfilled'])) {
            return response()->json([
                'success' => false,
                'message' => 'Disputes can only be raised on accepted or fulfilled contracts',
            ], 422);
        }

        // Check for existing open dispute
        if ($contract->hasActiveDispute()) {
            return response()->json([
                'success' => false,
                'message' => 'An active dispute already exists for this contract',
            ], 422);
        }

        // Create the dispute
        $dispute = Dispute::create([
            'contract_id' => $contract->id,
            'raised_by' => $user->id,
            'reason' => $validated['reason'],
            'status' => Dispute::STATUS_OPEN,
        ]);

        // Freeze contract funds in the pool
        $frozenCount = $this->poolService->freezeContractFunds($contract, $dispute);

        Log::info('Dispute created', [
            'dispute_id' => $dispute->id,
            'contract_id' => $contract->id,
            'raised_by' => $user->id,
            'frozen_transactions' => $frozenCount,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dispute raised successfully. Contract funds have been frozen pending review.',
            'data' => $dispute->load('contract:id,status,breeding_status'),
        ], 201);
    }

    /**
     * Get the authenticated user's disputes.
     * GET /api/disputes
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $disputes = Dispute::where('raised_by', $user->id)
            ->with(['contract:id,status,breeding_status', 'resolvedBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $disputes,
        ]);
    }

    /**
     * Get a specific dispute's details.
     * GET /api/disputes/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $dispute = Dispute::where('id', $id)
            ->where('raised_by', $user->id)
            ->with(['contract:id,status,breeding_status,collateral_total,collateral_per_owner', 'resolvedBy:id,name'])
            ->first();

        if (! $dispute) {
            return response()->json([
                'success' => false,
                'message' => 'Dispute not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $dispute,
        ]);
    }
}
