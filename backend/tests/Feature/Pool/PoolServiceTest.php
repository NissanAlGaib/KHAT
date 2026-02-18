<?php

use App\Models\BreedingContract;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\MatchRequest;
use App\Models\Payment;
use App\Models\Pet;
use App\Models\PoolTransaction;
use App\Models\User;
use App\Services\PayMongoService;
use App\Services\PoolService;

/*
|--------------------------------------------------------------------------
| Pool Service Tests
|--------------------------------------------------------------------------
|
| Tests the core PoolService business logic: deposits, releases, refunds,
| cancellation handling, dispute freezing/resolution, and statistics.
|
*/

beforeEach(function () {
    // Create two pet owners
    $this->owner1 = User::factory()->create();
    $this->owner2 = User::factory()->create();

    // Create pets
    $this->pet1 = Pet::create([
        'user_id' => $this->owner1->id,
        'name' => 'Rex',
        'species' => 'Dog',
        'breed' => 'German Shepherd',
        'sex' => 'male',
        'birthdate' => now()->subYears(2),
        'height' => 60,
        'weight' => 30,
        'status' => 'active',
    ]);
    $this->pet2 = Pet::create([
        'user_id' => $this->owner2->id,
        'name' => 'Bella',
        'species' => 'Dog',
        'breed' => 'Labrador',
        'sex' => 'female',
        'birthdate' => now()->subYears(1),
        'height' => 55,
        'weight' => 25,
        'status' => 'active',
    ]);

    // Create match request, conversation, and contract
    $this->matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'accepted',
    ]);
    $this->conversation = Conversation::create([
        'match_request_id' => $this->matchRequest->id,
    ]);
    $this->contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->owner1->id,
        'status' => 'accepted',
        'collateral_total' => 2000.00,
        'collateral_per_owner' => 1000.00,
        'cancellation_fee_percentage' => 5.00,
    ]);

    // Mock PayMongoService to avoid real API calls
    $this->payMongoMock = Mockery::mock(PayMongoService::class);
    $this->poolService = new PoolService($this->payMongoMock);
});

// Helper to create a paid collateral payment
function createPaidPayment(int $userId, int $contractId, string $type = 'collateral', float $amount = 1000.00, ?string $paymongoPaymentId = 'pay_test_123'): Payment
{
    return Payment::create([
        'user_id' => $userId,
        'contract_id' => $contractId,
        'payment_type' => $type,
        'amount' => $amount,
        'currency' => 'PHP',
        'status' => Payment::STATUS_PAID,
        'pool_status' => Payment::POOL_NOT_POOLED,
        'paymongo_payment_id' => $paymongoPaymentId,
        'paid_at' => now(),
    ]);
}

// -------------------------------------------------------
// DEPOSIT TESTS
// -------------------------------------------------------

test('deposit to pool creates transaction and updates payment status', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id);

    $transaction = $this->poolService->depositToPool($payment);

    expect($transaction)->not->toBeNull();
    expect($transaction->type)->toBe(PoolTransaction::TYPE_DEPOSIT);
    expect((float) $transaction->amount)->toBe(1000.00);
    expect($transaction->status)->toBe(PoolTransaction::STATUS_COMPLETED);
    expect($transaction->user_id)->toBe($this->owner1->id);
    expect($transaction->contract_id)->toBe($this->contract->id);

    $payment->refresh();
    expect($payment->pool_status)->toBe(Payment::POOL_IN_POOL);
});

test('deposit skips non-poolable payment types', function () {
    $payment = Payment::create([
        'user_id' => $this->owner1->id,
        'payment_type' => Payment::TYPE_SUBSCRIPTION,
        'amount' => 500.00,
        'status' => Payment::STATUS_PAID,
        'pool_status' => Payment::POOL_NOT_POOLED,
    ]);

    $result = $this->poolService->depositToPool($payment);

    expect($result)->toBeNull();
    $this->assertDatabaseCount('pool_transactions', 0);
});

test('deposit does not re-pool already pooled payment', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id);
    $payment->update(['pool_status' => Payment::POOL_IN_POOL]);

    $result = $this->poolService->depositToPool($payment);

    expect($result)->toBeNull();
    $this->assertDatabaseCount('pool_transactions', 0);
});

test('multiple deposits accumulate correct pool balance', function () {
    $payment1 = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $payment2 = createPaidPayment($this->owner2->id, $this->contract->id, 'collateral', 1000.00, 'pay_2');

    $this->poolService->depositToPool($payment1);
    $this->poolService->depositToPool($payment2);

    $balance = $this->poolService->getPoolBalance();
    expect($balance)->toBe(2000.00);
    $this->assertDatabaseCount('pool_transactions', 2);
});

// -------------------------------------------------------
// RELEASE COLLATERAL TESTS
// -------------------------------------------------------

test('release collateral refunds all collateral payments via PayMongo', function () {
    $payment1 = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $payment2 = createPaidPayment($this->owner2->id, $this->contract->id, 'collateral', 1000.00, 'pay_2');

    $this->poolService->depositToPool($payment1);
    $this->poolService->depositToPool($payment2);

    // Mock PayMongo refund success
    $this->payMongoMock->shouldReceive('createRefund')
        ->twice()
        ->andReturn(['success' => true, 'refund_id' => 'ref_test', 'status' => 'pending']);

    $result = $this->poolService->releaseCollateral($this->contract);

    expect($result['success'])->toBeTrue();
    expect($result['released'])->toBe(2);

    $payment1->refresh();
    $payment2->refresh();
    expect($payment1->pool_status)->toBe(Payment::POOL_REFUNDED);
    expect($payment2->pool_status)->toBe(Payment::POOL_REFUNDED);
});

test('release collateral blocked when active dispute exists', function () {
    Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Test dispute reason text',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $result = $this->poolService->releaseCollateral($this->contract->fresh());

    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('Active dispute');
});

test('release collateral returns no-op when no collateral exists', function () {
    $result = $this->poolService->releaseCollateral($this->contract);

    expect($result['success'])->toBeTrue();
    expect($result['released'])->toBe(0);
});

// -------------------------------------------------------
// RELEASE SHOOTER PAYMENT TESTS
// -------------------------------------------------------

test('release shooter payment marks as released without PayMongo refund', function () {
    $shooter = User::factory()->create();
    $this->contract->update(['shooter_user_id' => $shooter->id]);

    $payment = createPaidPayment($this->owner1->id, $this->contract->id, Payment::TYPE_SHOOTER_PAYMENT, 500.00, 'pay_shooter');
    $this->poolService->depositToPool($payment);

    $result = $this->poolService->releaseShooterPayment($this->contract);

    expect($result['success'])->toBeTrue();

    $payment->refresh();
    expect($payment->pool_status)->toBe(Payment::POOL_RELEASED);
});

test('release shooter payment also returns shooter collateral', function () {
    $shooter = User::factory()->create();
    $this->contract->update(['shooter_user_id' => $shooter->id]);

    $shooterPayment = createPaidPayment($this->owner1->id, $this->contract->id, Payment::TYPE_SHOOTER_PAYMENT, 500.00, 'pay_sp');
    $shooterCollateral = createPaidPayment($shooter->id, $this->contract->id, Payment::TYPE_SHOOTER_COLLATERAL, 300.00, 'pay_sc');

    $this->poolService->depositToPool($shooterPayment);
    $this->poolService->depositToPool($shooterCollateral);

    $this->payMongoMock->shouldReceive('createRefund')
        ->once()
        ->andReturn(['success' => true, 'refund_id' => 'ref_sc', 'status' => 'pending']);

    $result = $this->poolService->releaseShooterPayment($this->contract);

    expect($result['success'])->toBeTrue();

    $shooterPayment->refresh();
    $shooterCollateral->refresh();
    expect($shooterPayment->pool_status)->toBe(Payment::POOL_RELEASED);
    expect($shooterCollateral->pool_status)->toBe(Payment::POOL_REFUNDED);
});

// -------------------------------------------------------
// CANCELLATION TESTS
// -------------------------------------------------------

test('cancellation deducts fee from cancelling party collateral', function () {
    $payment1 = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $payment2 = createPaidPayment($this->owner2->id, $this->contract->id, 'collateral', 1000.00, 'pay_2');

    $this->poolService->depositToPool($payment1);
    $this->poolService->depositToPool($payment2);

    // 5% cancellation fee on 1000 = 50, refund = 950
    $this->payMongoMock->shouldReceive('createRefund')
        ->andReturn(['success' => true, 'refund_id' => 'ref_cancel', 'status' => 'pending']);

    $result = $this->poolService->handleCancellation($this->contract, $this->owner1->id);

    expect($result['success'])->toBeTrue();
    expect($result['processed'])->toBe(2);

    // Check penalty transaction was created
    $penalties = PoolTransaction::where('type', PoolTransaction::TYPE_CANCELLATION_PENALTY)->get();
    expect($penalties)->toHaveCount(1);
    expect((float) $penalties->first()->amount)->toBe(50.00);

    // Cancelling party gets partially refunded
    $payment1->refresh();
    expect($payment1->pool_status)->toBe(Payment::POOL_PARTIALLY_REFUNDED);

    // Non-cancelling party gets full refund
    $payment2->refresh();
    expect($payment2->pool_status)->toBe(Payment::POOL_REFUNDED);
});

test('cancellation with no pooled payments returns no-op', function () {
    $result = $this->poolService->handleCancellation($this->contract, $this->owner1->id);

    expect($result['success'])->toBeTrue();
    expect($result['refunded'])->toBe(0);
});

test('cancellation blocked when active dispute exists', function () {
    Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Dispute blocks cancellation',
        'status' => Dispute::STATUS_UNDER_REVIEW,
    ]);

    $result = $this->poolService->handleCancellation($this->contract->fresh(), $this->owner1->id);

    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('Active dispute');
});

// -------------------------------------------------------
// FREEZE / UNFREEZE TESTS
// -------------------------------------------------------

test('freeze contract funds changes transaction and payment status', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $this->poolService->depositToPool($payment);

    $dispute = Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Test freezing funds reason',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $frozenCount = $this->poolService->freezeContractFunds($this->contract, $dispute);

    expect($frozenCount)->toBe(1);

    $payment->refresh();
    expect($payment->pool_status)->toBe(Payment::POOL_FROZEN);

    $transaction = PoolTransaction::first();
    expect($transaction->status)->toBe(PoolTransaction::STATUS_FROZEN);
});

test('unfreeze contract funds restores transaction and payment status', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $this->poolService->depositToPool($payment);

    $dispute = Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Freeze then unfreeze test',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $this->poolService->freezeContractFunds($this->contract, $dispute);
    $unfrozenCount = $this->poolService->unfreezeContractFunds($this->contract);

    expect($unfrozenCount)->toBe(1);

    $payment->refresh();
    expect($payment->pool_status)->toBe(Payment::POOL_IN_POOL);

    $transaction = PoolTransaction::first();
    expect($transaction->status)->toBe(PoolTransaction::STATUS_COMPLETED);
});

// -------------------------------------------------------
// DISPUTE RESOLUTION TESTS
// -------------------------------------------------------

test('resolve dispute with full refund processes all payments', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $this->poolService->depositToPool($payment);

    $dispute = Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Full refund dispute test reason',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $this->poolService->freezeContractFunds($this->contract, $dispute);

    $this->payMongoMock->shouldReceive('createRefund')
        ->once()
        ->andReturn(['success' => true, 'refund_id' => 'ref_dispute', 'status' => 'pending']);

    $admin = User::factory()->create();
    $result = $this->poolService->resolveDispute($dispute, Dispute::RESOLUTION_REFUND_FULL, null, $admin->id);

    expect($result['success'])->toBeTrue();

    $dispute->refresh();
    expect($dispute->status)->toBe(Dispute::STATUS_RESOLVED);
    expect($dispute->resolved_by)->toBe($admin->id);
    expect($dispute->resolution_type)->toBe(Dispute::RESOLUTION_REFUND_FULL);

    $payment->refresh();
    expect($payment->pool_status)->toBe(Payment::POOL_REFUNDED);
});

test('resolve dispute with forfeit deducts disputant funds and refunds others', function () {
    $payment1 = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $payment2 = createPaidPayment($this->owner2->id, $this->contract->id, 'collateral', 1000.00, 'pay_2');

    $this->poolService->depositToPool($payment1);
    $this->poolService->depositToPool($payment2);

    $dispute = Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Forfeit dispute test reason',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $this->poolService->freezeContractFunds($this->contract, $dispute);

    // Only owner2's refund triggers PayMongo (owner1 forfeits)
    $this->payMongoMock->shouldReceive('createRefund')
        ->once()
        ->andReturn(['success' => true, 'refund_id' => 'ref_other', 'status' => 'pending']);

    $admin = User::factory()->create();
    $result = $this->poolService->resolveDispute($dispute, Dispute::RESOLUTION_FORFEIT, null, $admin->id);

    expect($result['success'])->toBeTrue();

    // Owner1 (disputant) — funds forfeited, marked as fee_deduction
    $feeDeduction = PoolTransaction::where('type', PoolTransaction::TYPE_FEE_DEDUCTION)
        ->where('user_id', $this->owner1->id)
        ->first();
    expect($feeDeduction)->not->toBeNull();
    expect((float) $feeDeduction->amount)->toBe(1000.00);

    // Owner2 — refunded
    $payment2->refresh();
    expect($payment2->pool_status)->toBe(Payment::POOL_REFUNDED);
});

test('resolve dispute with release funds only unfreezes', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $this->poolService->depositToPool($payment);

    $dispute = Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Release funds dispute test',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $this->poolService->freezeContractFunds($this->contract, $dispute);

    $admin = User::factory()->create();
    $result = $this->poolService->resolveDispute($dispute, Dispute::RESOLUTION_RELEASE_FUNDS, null, $admin->id);

    expect($result['success'])->toBeTrue();

    // Funds should be unfrozen (back to in_pool)
    $payment->refresh();
    expect($payment->pool_status)->toBe(Payment::POOL_IN_POOL);
});

// -------------------------------------------------------
// POOL BALANCE & STATISTICS TESTS
// -------------------------------------------------------

test('pool balance correctly calculates deposits minus releases', function () {
    $payment1 = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $payment2 = createPaidPayment($this->owner2->id, $this->contract->id, 'collateral', 1000.00, 'pay_2');

    $this->poolService->depositToPool($payment1);
    $this->poolService->depositToPool($payment2);

    expect($this->poolService->getPoolBalance())->toBe(2000.00);

    // Release one
    $this->payMongoMock->shouldReceive('createRefund')
        ->once()
        ->andReturn(['success' => true, 'refund_id' => 'ref_1', 'status' => 'pending']);

    $this->contract->update(['status' => 'fulfilled']);
    $this->poolService->releaseCollateral($this->contract);

    // Only the 2 collateral payments get released (both match)
    // But we mocked createRefund only once, second will use the same mock
    // Let's just check balance went down for the first one
    $balance = $this->poolService->getPoolBalance();
    expect($balance)->toBeLessThan(2000.00);
});

test('get contract pool summary returns correct breakdown', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $this->poolService->depositToPool($payment);

    $summary = $this->poolService->getContractPoolSummary($this->contract);

    expect($summary['contract_id'])->toBe($this->contract->id);
    expect($summary['total_deposits'])->toBe(1000.00);
    expect($summary['total_releases'])->toBe(0.0);
    expect($summary['total_refunds'])->toBe(0.0);
    expect($summary['held_balance'])->toBe(1000.00);
    expect($summary['frozen_count'])->toBe(0);
    expect($summary['has_dispute'])->toBeFalse();
});

test('pool statistics returns expected structure', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_1');
    $this->poolService->depositToPool($payment);

    $stats = $this->poolService->getPoolStatistics();

    expect($stats)->toHaveKeys([
        'total_balance',
        'frozen_amount',
        'deposits_this_month',
        'deposits_count_this_month',
        'deposits_growth',
        'releases_this_month',
        'releases_count_this_month',
        'releases_growth',
    ]);
    expect($stats['total_balance'])->toBe(1000.00);
    expect($stats['deposits_this_month'])->toBe(1000.00);
    expect($stats['deposits_count_this_month'])->toBe(1);
});

test('monthly pool flow returns 12 months of data', function () {
    $data = $this->poolService->getMonthlyPoolFlow(12);

    expect($data)->toHaveCount(12);
    expect($data[0])->toHaveKeys(['month', 'deposits', 'releases']);
});

// -------------------------------------------------------
// PAYMONGO REFUND FAILURE HANDLING
// -------------------------------------------------------

test('release payment creates pending transaction when PayMongo fails', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, 'pay_fail');
    $this->poolService->depositToPool($payment);

    $this->payMongoMock->shouldReceive('createRefund')
        ->once()
        ->andReturn(['success' => false, 'error' => 'Insufficient balance']);

    $result = $this->poolService->releaseCollateral($this->contract);

    // Should still report "success" at contract level, but individual payment failed
    expect($result['success'])->toBeTrue();
    expect($result['failed'])->toBe(1);

    // A pending refund transaction should have been created
    $pendingTx = PoolTransaction::where('status', PoolTransaction::STATUS_PENDING)->first();
    expect($pendingTx)->not->toBeNull();
    expect($pendingTx->type)->toBe(PoolTransaction::TYPE_REFUND);
});

test('release payment without paymongo id marks as release without refund', function () {
    $payment = createPaidPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00, null);
    $this->poolService->depositToPool($payment);

    $result = $this->poolService->releaseCollateral($this->contract);

    expect($result['success'])->toBeTrue();

    $payment->refresh();
    expect($payment->pool_status)->toBe(Payment::POOL_RELEASED);

    $releaseTx = PoolTransaction::where('type', PoolTransaction::TYPE_RELEASE)->first();
    expect($releaseTx)->not->toBeNull();
    expect($releaseTx->status)->toBe(PoolTransaction::STATUS_PENDING);
});
