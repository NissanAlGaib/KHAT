<?php

namespace App\Services;

use App\Models\BreedingContract;
use App\Models\Dispute;
use App\Models\Payment;
use App\Models\PoolTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PoolService
{
    private PayMongoService $payMongoService;

    public function __construct(PayMongoService $payMongoService)
    {
        $this->payMongoService = $payMongoService;
    }

    /**
     * Deposit a paid contract payment into the pool.
     * Called after a contract payment is verified as paid.
     */
    public function depositToPool(Payment $payment): ?PoolTransaction
    {
        // Only pool contract-related payment types
        if (! $payment->isPoolable()) {
            return null;
        }

        // Don't re-pool if already in pool
        if ($payment->pool_status !== Payment::POOL_NOT_POOLED) {
            Log::warning('Payment already in pool', ['payment_id' => $payment->id, 'pool_status' => $payment->pool_status]);
            return null;
        }

        return DB::transaction(function () use ($payment) {
            $currentBalance = $this->getPoolBalance();

            $transaction = PoolTransaction::create([
                'payment_id' => $payment->id,
                'contract_id' => $payment->contract_id,
                'user_id' => $payment->user_id,
                'type' => PoolTransaction::TYPE_DEPOSIT,
                'amount' => $payment->amount,
                'currency' => $payment->currency ?? 'PHP',
                'balance_after' => $currentBalance + (float) $payment->amount,
                'status' => PoolTransaction::STATUS_COMPLETED,
                'description' => "Pool deposit for {$payment->payment_type} - Contract #{$payment->contract_id}",
                'metadata' => [
                    'payment_type' => $payment->payment_type,
                    'paymongo_payment_id' => $payment->paymongo_payment_id,
                ],
                'processed_at' => now(),
            ]);

            $payment->update(['pool_status' => Payment::POOL_IN_POOL]);

            Log::info('Payment deposited to pool', [
                'payment_id' => $payment->id,
                'transaction_id' => $transaction->id,
                'amount' => $payment->amount,
                'contract_id' => $payment->contract_id,
            ]);

            return $transaction;
        });
    }

    /**
     * Release all collateral deposits for a fulfilled contract.
     * Triggers PayMongo refunds back to original payers.
     */
    public function releaseCollateral(BreedingContract $contract): array
    {
        if ($contract->hasActiveDispute()) {
            Log::warning('Cannot release collateral - active dispute exists', ['contract_id' => $contract->id]);
            return ['success' => false, 'error' => 'Active dispute exists for this contract'];
        }

        $collateralPayments = Payment::where('contract_id', $contract->id)
            ->where('payment_type', Payment::TYPE_COLLATERAL)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->get();

        if ($collateralPayments->isEmpty()) {
            return ['success' => true, 'message' => 'No collateral to release', 'released' => 0];
        }

        $results = [];
        foreach ($collateralPayments as $payment) {
            $results[] = $this->releasePayment($payment, 'Contract fulfilled - collateral return');
        }

        return [
            'success' => true,
            'released' => count(array_filter($results, fn($r) => $r['success'])),
            'failed' => count(array_filter($results, fn($r) => !$r['success'])),
            'details' => $results,
        ];
    }

    /**
     * Release the shooter's service payment on breeding completion.
     * Note: Since PayMongo refunds return to original payer,
     * the shooter payment is marked as "released" but actual
     * payout to the shooter must be handled manually/separately.
     */
    public function releaseShooterPayment(BreedingContract $contract): array
    {
        if ($contract->hasActiveDispute()) {
            Log::warning('Cannot release shooter payment - active dispute exists', ['contract_id' => $contract->id]);
            return ['success' => false, 'error' => 'Active dispute exists for this contract'];
        }

        $shooterPayments = Payment::where('contract_id', $contract->id)
            ->where('payment_type', Payment::TYPE_SHOOTER_PAYMENT)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->get();

        if ($shooterPayments->isEmpty()) {
            return ['success' => true, 'message' => 'No shooter payment to release', 'released' => 0];
        }

        $results = [];
        foreach ($shooterPayments as $payment) {
            // Mark as released in pool (actual payout to shooter is manual)
            $result = DB::transaction(function () use ($payment) {
                $currentBalance = $this->getPoolBalance();

                $transaction = PoolTransaction::create([
                    'payment_id' => $payment->id,
                    'contract_id' => $payment->contract_id,
                    'user_id' => $payment->user_id,
                    'type' => PoolTransaction::TYPE_RELEASE,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency ?? 'PHP',
                    'balance_after' => $currentBalance - (float) $payment->amount,
                    'status' => PoolTransaction::STATUS_COMPLETED,
                    'description' => "Shooter payment released - Contract #{$payment->contract_id}",
                    'metadata' => [
                        'payment_type' => $payment->payment_type,
                        'note' => 'Marked as released; actual payout to shooter handled separately.',
                    ],
                    'processed_at' => now(),
                ]);

                $payment->update(['pool_status' => Payment::POOL_RELEASED]);

                return ['success' => true, 'transaction_id' => $transaction->id];
            });

            $results[] = $result;
        }

        // Also release shooter collateral back to shooter
        $shooterCollateralPayments = Payment::where('contract_id', $contract->id)
            ->where('payment_type', Payment::TYPE_SHOOTER_COLLATERAL)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->get();

        foreach ($shooterCollateralPayments as $payment) {
            $results[] = $this->releasePayment($payment, 'Shooter collateral return - breeding completed');
        }

        return [
            'success' => true,
            'released' => count(array_filter($results, fn($r) => $r['success'])),
            'details' => $results,
        ];
    }

    /**
     * Handle contract cancellation with partial refund minus cancellation fee.
     *
     * @param BreedingContract $contract
     * @param int|null $cancelledByUserId The user who initiated the cancellation
     */
    public function handleCancellation(BreedingContract $contract, ?int $cancelledByUserId = null): array
    {
        if ($contract->hasActiveDispute()) {
            return ['success' => false, 'error' => 'Active dispute exists for this contract'];
        }

        $cancellationFeePercentage = (float) ($contract->cancellation_fee_percentage ?? 5);

        // Get all pooled payments for this contract
        $pooledPayments = Payment::where('contract_id', $contract->id)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->get();

        if ($pooledPayments->isEmpty()) {
            return ['success' => true, 'message' => 'No pooled payments to process', 'refunded' => 0];
        }

        $results = [];

        foreach ($pooledPayments as $payment) {
            $isCancellingParty = $cancelledByUserId && $payment->user_id === $cancelledByUserId;
            $isCollateral = in_array($payment->payment_type, [Payment::TYPE_COLLATERAL, Payment::TYPE_SHOOTER_COLLATERAL]);

            if ($isCollateral && $isCancellingParty) {
                // Cancelling party: deduct cancellation fee, refund the rest
                $feeAmount = round((float) $payment->amount * ($cancellationFeePercentage / 100), 2);
                $refundAmount = (float) $payment->amount - $feeAmount;

                $result = DB::transaction(function () use ($payment, $feeAmount, $refundAmount) {
                    $currentBalance = $this->getPoolBalance();

                    // Record fee deduction
                    if ($feeAmount > 0) {
                        PoolTransaction::create([
                            'payment_id' => $payment->id,
                            'contract_id' => $payment->contract_id,
                            'user_id' => $payment->user_id,
                            'type' => PoolTransaction::TYPE_CANCELLATION_PENALTY,
                            'amount' => $feeAmount,
                            'currency' => $payment->currency ?? 'PHP',
                            'balance_after' => $currentBalance, // Fee stays in pool (platform revenue)
                            'status' => PoolTransaction::STATUS_COMPLETED,
                            'description' => "Cancellation penalty ({$payment->contract->cancellation_fee_percentage}%)",
                            'processed_at' => now(),
                        ]);
                    }

                    // Refund remainder
                    if ($refundAmount > 0) {
                        return $this->processRefund($payment, $refundAmount, 'Partial refund after cancellation penalty');
                    }

                    $payment->update(['pool_status' => Payment::POOL_REFUNDED]);
                    return ['success' => true, 'fee' => $feeAmount, 'refunded' => 0];
                });

                $results[] = $result;
            } else {
                // Non-cancelling party or non-collateral: full refund
                $results[] = $this->releasePayment($payment, 'Contract cancelled - full refund');
            }
        }

        return [
            'success' => true,
            'processed' => count($results),
            'details' => $results,
        ];
    }

    /**
     * Freeze all pool transactions for a contract due to a dispute.
     */
    public function freezeContractFunds(BreedingContract $contract, Dispute $dispute): int
    {
        $affected = DB::transaction(function () use ($contract, $dispute) {
            // Freeze pool transactions
            $count = PoolTransaction::where('contract_id', $contract->id)
                ->where('status', PoolTransaction::STATUS_COMPLETED)
                ->whereIn('type', [PoolTransaction::TYPE_DEPOSIT, PoolTransaction::TYPE_HOLD])
                ->update(['status' => PoolTransaction::STATUS_FROZEN]);

            // Freeze the payment pool statuses
            Payment::where('contract_id', $contract->id)
                ->where('pool_status', Payment::POOL_IN_POOL)
                ->update(['pool_status' => Payment::POOL_FROZEN]);

            Log::info('Contract funds frozen', [
                'contract_id' => $contract->id,
                'dispute_id' => $dispute->id,
                'transactions_frozen' => $count,
            ]);

            return $count;
        });

        return $affected;
    }

    /**
     * Unfreeze pool transactions for a contract after dispute resolution.
     */
    public function unfreezeContractFunds(BreedingContract $contract): int
    {
        $affected = DB::transaction(function () use ($contract) {
            $count = PoolTransaction::where('contract_id', $contract->id)
                ->where('status', PoolTransaction::STATUS_FROZEN)
                ->update(['status' => PoolTransaction::STATUS_COMPLETED]);

            Payment::where('contract_id', $contract->id)
                ->where('pool_status', Payment::POOL_FROZEN)
                ->update(['pool_status' => Payment::POOL_IN_POOL]);

            Log::info('Contract funds unfrozen', [
                'contract_id' => $contract->id,
                'transactions_unfrozen' => $count,
            ]);

            return $count;
        });

        return $affected;
    }

    /**
     * Resolve a dispute by processing funds according to the resolution.
     */
    public function resolveDispute(Dispute $dispute, string $resolutionType, ?float $amount = null, ?int $adminId = null): array
    {
        $contract = $dispute->contract;

        // First unfreeze the funds
        $this->unfreezeContractFunds($contract);

        $result = match ($resolutionType) {
            Dispute::RESOLUTION_REFUND_FULL => $this->processDisputeFullRefund($contract, $dispute, $adminId),
            Dispute::RESOLUTION_REFUND_PARTIAL => $this->processDisputePartialRefund($contract, $dispute, $amount, $adminId),
            Dispute::RESOLUTION_RELEASE_FUNDS => $this->processDisputeReleaseFunds($contract, $dispute, $adminId),
            Dispute::RESOLUTION_FORFEIT => $this->processDisputeForfeit($contract, $dispute, $adminId),
            default => ['success' => false, 'error' => 'Invalid resolution type'],
        };

        // Update the dispute record
        $dispute->update([
            'status' => Dispute::STATUS_RESOLVED,
            'resolved_by' => $adminId,
            'resolution_type' => $resolutionType,
            'resolved_amount' => $amount,
        ]);

        return $result;
    }

    /**
     * Get total pool balance (all funds currently held).
     */
    public function getPoolBalance(): float
    {
        $deposits = PoolTransaction::whereIn('type', [
            PoolTransaction::TYPE_DEPOSIT,
            PoolTransaction::TYPE_HOLD,
            PoolTransaction::TYPE_FEE_DEDUCTION,
            PoolTransaction::TYPE_CANCELLATION_PENALTY,
        ])
            ->whereIn('status', [PoolTransaction::STATUS_COMPLETED, PoolTransaction::STATUS_FROZEN])
            ->sum('amount');

        $releases = PoolTransaction::whereIn('type', [
            PoolTransaction::TYPE_RELEASE,
            PoolTransaction::TYPE_REFUND,
        ])
            ->where('status', PoolTransaction::STATUS_COMPLETED)
            ->sum('amount');

        return (float) $deposits - (float) $releases;
    }

    /**
     * Get a summary of pool state for a specific contract.
     */
    public function getContractPoolSummary(BreedingContract $contract): array
    {
        $transactions = PoolTransaction::where('contract_id', $contract->id)
            ->orderBy('created_at', 'asc')
            ->get();

        $totalDeposits = $transactions->whereIn('type', [PoolTransaction::TYPE_DEPOSIT, PoolTransaction::TYPE_HOLD])->sum('amount');
        $totalReleases = $transactions->where('type', PoolTransaction::TYPE_RELEASE)->sum('amount');
        $totalRefunds = $transactions->where('type', PoolTransaction::TYPE_REFUND)->sum('amount');
        $totalPenalties = $transactions->where('type', PoolTransaction::TYPE_CANCELLATION_PENALTY)->sum('amount');
        $frozenCount = $transactions->where('status', PoolTransaction::STATUS_FROZEN)->count();

        return [
            'contract_id' => $contract->id,
            'total_deposits' => (float) $totalDeposits,
            'total_releases' => (float) $totalReleases,
            'total_refunds' => (float) $totalRefunds,
            'total_penalties' => (float) $totalPenalties,
            'held_balance' => (float) $totalDeposits - (float) $totalReleases - (float) $totalRefunds,
            'frozen_count' => $frozenCount,
            'has_dispute' => $contract->hasActiveDispute(),
            'transactions' => $transactions,
        ];
    }

    /**
     * Get pool statistics for admin dashboard.
     */
    public function getPoolStatistics(): array
    {
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth();

        $totalBalance = $this->getPoolBalance();

        // Current month stats
        $depositsThisMonth = PoolTransaction::deposits()->completed()
            ->where('created_at', '>=', $startOfMonth)->sum('amount');
        $releasesThisMonth = PoolTransaction::releases()->completed()
            ->where('created_at', '>=', $startOfMonth)->sum('amount');
        $depositsCountThisMonth = PoolTransaction::deposits()->completed()
            ->where('created_at', '>=', $startOfMonth)->count();
        $releasesCountThisMonth = PoolTransaction::releases()->completed()
            ->where('created_at', '>=', $startOfMonth)->count();

        // Last month stats for growth calculation
        $depositsLastMonth = PoolTransaction::deposits()->completed()
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->sum('amount');
        $releasesLastMonth = PoolTransaction::releases()->completed()
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])->sum('amount');

        // Frozen
        $frozenAmount = PoolTransaction::frozen()
            ->whereIn('type', [PoolTransaction::TYPE_DEPOSIT, PoolTransaction::TYPE_HOLD])
            ->sum('amount');

        // Growth percentages
        $depositsGrowth = $depositsLastMonth > 0
            ? round((($depositsThisMonth - $depositsLastMonth) / $depositsLastMonth) * 100, 1)
            : ($depositsThisMonth > 0 ? 100 : 0);
        $releasesGrowth = $releasesLastMonth > 0
            ? round((($releasesThisMonth - $releasesLastMonth) / $releasesLastMonth) * 100, 1)
            : ($releasesThisMonth > 0 ? 100 : 0);

        return [
            'total_balance' => $totalBalance,
            'frozen_amount' => (float) $frozenAmount,
            'deposits_this_month' => (float) $depositsThisMonth,
            'deposits_count_this_month' => $depositsCountThisMonth,
            'deposits_growth' => $depositsGrowth,
            'releases_this_month' => (float) $releasesThisMonth,
            'releases_count_this_month' => $releasesCountThisMonth,
            'releases_growth' => $releasesGrowth,
        ];
    }

    /**
     * Get revenue breakdown by payment type (for pie chart).
     */
    public function getRevenueByType(): array
    {
        return PoolTransaction::deposits()
            ->completed()
            ->selectRaw("JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.payment_type')) as payment_type, SUM(amount) as total")
            ->groupBy('payment_type')
            ->pluck('total', 'payment_type')
            ->toArray();
    }

    /**
     * Get monthly pool flow data for line chart (last 12 months).
     */
    public function getMonthlyPoolFlow(int $months = 12): array
    {
        $data = [];
        $now = now();

        for ($i = $months - 1; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();

            $deposits = PoolTransaction::deposits()
                ->whereIn('status', [PoolTransaction::STATUS_COMPLETED, PoolTransaction::STATUS_FROZEN])
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount');

            $releases = PoolTransaction::whereIn('type', [PoolTransaction::TYPE_RELEASE, PoolTransaction::TYPE_REFUND])
                ->where('status', PoolTransaction::STATUS_COMPLETED)
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount');

            $data[] = [
                'month' => $month->format('M Y'),
                'deposits' => (float) $deposits,
                'releases' => (float) $releases,
            ];
        }

        return $data;
    }

    // -------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------

    /**
     * Release a single payment from the pool via PayMongo refund.
     */
    private function releasePayment(Payment $payment, string $description): array
    {
        if (! $payment->paymongo_payment_id) {
            Log::warning('Cannot refund payment without PayMongo payment ID', ['payment_id' => $payment->id]);
            return $this->markReleaseWithoutRefund($payment, $description, 'No PayMongo payment ID - manual action required');
        }

        $amountInCentavos = (int) round((float) $payment->amount * 100);

        $refundResult = $this->payMongoService->createRefund(
            $payment->paymongo_payment_id,
            $amountInCentavos,
            'requested_by_customer'
        );

        if (! $refundResult['success']) {
            Log::error('PayMongo refund failed, marking as pending', [
                'payment_id' => $payment->id,
                'error' => $refundResult['error'],
            ]);

            // Mark transaction as pending so admin can retry
            return $this->markReleasePending($payment, $description, $refundResult['error']);
        }

        return DB::transaction(function () use ($payment, $description, $refundResult) {
            $currentBalance = $this->getPoolBalance();

            $transaction = PoolTransaction::create([
                'payment_id' => $payment->id,
                'contract_id' => $payment->contract_id,
                'user_id' => $payment->user_id,
                'type' => PoolTransaction::TYPE_REFUND,
                'amount' => $payment->amount,
                'currency' => $payment->currency ?? 'PHP',
                'balance_after' => $currentBalance - (float) $payment->amount,
                'status' => PoolTransaction::STATUS_COMPLETED,
                'description' => $description,
                'metadata' => [
                    'paymongo_refund_id' => $refundResult['refund_id'],
                    'refund_status' => $refundResult['status'],
                ],
                'processed_at' => now(),
            ]);

            $payment->update([
                'pool_status' => Payment::POOL_REFUNDED,
                'paymongo_refund_id' => $refundResult['refund_id'],
            ]);

            return ['success' => true, 'transaction_id' => $transaction->id, 'refund_id' => $refundResult['refund_id']];
        });
    }

    /**
     * Process a partial refund for a payment (after cancellation penalty deduction).
     */
    private function processRefund(Payment $payment, float $refundAmount, string $description): array
    {
        if (! $payment->paymongo_payment_id) {
            return $this->markReleaseWithoutRefund($payment, $description, 'No PayMongo payment ID');
        }

        $amountInCentavos = (int) round($refundAmount * 100);

        $refundResult = $this->payMongoService->createRefund(
            $payment->paymongo_payment_id,
            $amountInCentavos,
            'requested_by_customer'
        );

        if (! $refundResult['success']) {
            return $this->markReleasePending($payment, $description, $refundResult['error']);
        }

        $currentBalance = $this->getPoolBalance();

        $transaction = PoolTransaction::create([
            'payment_id' => $payment->id,
            'contract_id' => $payment->contract_id,
            'user_id' => $payment->user_id,
            'type' => PoolTransaction::TYPE_REFUND,
            'amount' => $refundAmount,
            'currency' => $payment->currency ?? 'PHP',
            'balance_after' => $currentBalance - $refundAmount,
            'status' => PoolTransaction::STATUS_COMPLETED,
            'description' => $description,
            'metadata' => [
                'original_amount' => $payment->amount,
                'refund_amount' => $refundAmount,
                'paymongo_refund_id' => $refundResult['refund_id'],
            ],
            'processed_at' => now(),
        ]);

        $payment->update([
            'pool_status' => Payment::POOL_PARTIALLY_REFUNDED,
            'paymongo_refund_id' => $refundResult['refund_id'],
        ]);

        return ['success' => true, 'transaction_id' => $transaction->id, 'refunded' => $refundAmount];
    }

    /**
     * Mark a release as completed without actual PayMongo refund.
     * Used when PayMongo payment ID is missing (e.g., shooter payout).
     */
    private function markReleaseWithoutRefund(Payment $payment, string $description, string $note): array
    {
        $currentBalance = $this->getPoolBalance();

        $transaction = PoolTransaction::create([
            'payment_id' => $payment->id,
            'contract_id' => $payment->contract_id,
            'user_id' => $payment->user_id,
            'type' => PoolTransaction::TYPE_RELEASE,
            'amount' => $payment->amount,
            'currency' => $payment->currency ?? 'PHP',
            'balance_after' => $currentBalance - (float) $payment->amount,
            'status' => PoolTransaction::STATUS_PENDING,
            'description' => "{$description} - {$note}",
            'processed_at' => now(),
        ]);

        $payment->update(['pool_status' => Payment::POOL_RELEASED]);

        return ['success' => true, 'transaction_id' => $transaction->id, 'note' => $note];
    }

    /**
     * Mark a release as pending (refund failed, needs manual retry).
     */
    private function markReleasePending(Payment $payment, string $description, string $error): array
    {
        $currentBalance = $this->getPoolBalance();

        $transaction = PoolTransaction::create([
            'payment_id' => $payment->id,
            'contract_id' => $payment->contract_id,
            'user_id' => $payment->user_id,
            'type' => PoolTransaction::TYPE_REFUND,
            'amount' => $payment->amount,
            'currency' => $payment->currency ?? 'PHP',
            'balance_after' => $currentBalance,
            'status' => PoolTransaction::STATUS_PENDING,
            'description' => "{$description} - PENDING (refund failed: {$error})",
            'metadata' => ['error' => $error],
            'processed_at' => now(),
        ]);

        return ['success' => false, 'transaction_id' => $transaction->id, 'error' => $error];
    }

    /**
     * Full refund all pooled payments for a dispute resolution.
     */
    private function processDisputeFullRefund(BreedingContract $contract, Dispute $dispute, ?int $adminId): array
    {
        $payments = Payment::where('contract_id', $contract->id)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->get();

        $results = [];
        foreach ($payments as $payment) {
            $results[] = $this->releasePayment($payment, "Dispute #{$dispute->id} resolved - full refund");
        }

        return ['success' => true, 'refunded' => count($results), 'details' => $results];
    }

    /**
     * Partial refund for a dispute resolution.
     */
    private function processDisputePartialRefund(BreedingContract $contract, Dispute $dispute, ?float $amount, ?int $adminId): array
    {
        if (! $amount || $amount <= 0) {
            return ['success' => false, 'error' => 'Invalid refund amount'];
        }

        // Get the dispute raiser's pooled payment to refund from
        $payment = Payment::where('contract_id', $contract->id)
            ->where('user_id', $dispute->raised_by)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->first();

        if (! $payment) {
            return ['success' => false, 'error' => 'No pooled payment found for dispute raiser'];
        }

        return $this->processRefund($payment, $amount, "Dispute #{$dispute->id} resolved - partial refund");
    }

    /**
     * Release all funds normally (dispute dismissed, no refund needed).
     */
    private function processDisputeReleaseFunds(BreedingContract $contract, Dispute $dispute, ?int $adminId): array
    {
        // Funds remain in pool as-is (already unfrozen above)
        Log::info('Dispute resolved - funds released normally', [
            'contract_id' => $contract->id,
            'dispute_id' => $dispute->id,
        ]);

        return ['success' => true, 'action' => 'Funds unfrozen and available for normal release'];
    }

    /**
     * Forfeit all funds (dispute raiser loses their deposit).
     */
    private function processDisputeForfeit(BreedingContract $contract, Dispute $dispute, ?int $adminId): array
    {
        $payment = Payment::where('contract_id', $contract->id)
            ->where('user_id', $dispute->raised_by)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->first();

        if ($payment) {
            $currentBalance = $this->getPoolBalance();

            PoolTransaction::create([
                'payment_id' => $payment->id,
                'contract_id' => $contract->id,
                'user_id' => $payment->user_id,
                'type' => PoolTransaction::TYPE_FEE_DEDUCTION,
                'amount' => $payment->amount,
                'currency' => $payment->currency ?? 'PHP',
                'balance_after' => $currentBalance,
                'status' => PoolTransaction::STATUS_COMPLETED,
                'description' => "Dispute #{$dispute->id} - funds forfeited",
                'processed_at' => now(),
                'processed_by' => $adminId,
            ]);

            $payment->update(['pool_status' => Payment::POOL_RELEASED]);
        }

        // Refund the other party's collateral
        $otherPayments = Payment::where('contract_id', $contract->id)
            ->where('user_id', '!=', $dispute->raised_by)
            ->where('status', Payment::STATUS_PAID)
            ->where('pool_status', Payment::POOL_IN_POOL)
            ->get();

        foreach ($otherPayments as $otherPayment) {
            $this->releasePayment($otherPayment, "Dispute #{$dispute->id} - refund to non-disputing party");
        }

        return ['success' => true, 'action' => 'Disputing party funds forfeited, other party refunded'];
    }
}
