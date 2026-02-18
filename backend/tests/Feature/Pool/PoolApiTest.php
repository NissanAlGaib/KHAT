<?php

use App\Models\BreedingContract;
use App\Models\Conversation;
use App\Models\Dispute;
use App\Models\MatchRequest;
use App\Models\Payment;
use App\Models\Pet;
use App\Models\PoolTransaction;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Pool API Endpoint Tests
|--------------------------------------------------------------------------
|
| Tests the user-facing Pool and Dispute REST API endpoints.
|
*/

beforeEach(function () {
    $this->owner1 = User::factory()->create();
    $this->owner2 = User::factory()->create();

    $this->pet1 = Pet::create([
        'user_id' => $this->owner1->id,
        'name' => 'Max',
        'species' => 'Dog',
        'breed' => 'Husky',
        'sex' => 'male',
        'birthdate' => now()->subYears(3),
        'height' => 55,
        'weight' => 25,
        'status' => 'active',
    ]);
    $this->pet2 = Pet::create([
        'user_id' => $this->owner2->id,
        'name' => 'Daisy',
        'species' => 'Dog',
        'breed' => 'Poodle',
        'sex' => 'female',
        'birthdate' => now()->subYears(2),
        'height' => 45,
        'weight' => 18,
        'status' => 'active',
    ]);

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
});

// Helper
function createPooledPayment(int $userId, int $contractId, string $type = 'collateral', float $amount = 1000.00): Payment
{
    $payment = Payment::create([
        'user_id' => $userId,
        'contract_id' => $contractId,
        'payment_type' => $type,
        'amount' => $amount,
        'currency' => 'PHP',
        'status' => Payment::STATUS_PAID,
        'pool_status' => Payment::POOL_IN_POOL,
        'paymongo_payment_id' => 'pay_' . uniqid(),
        'paid_at' => now(),
    ]);

    PoolTransaction::create([
        'payment_id' => $payment->id,
        'contract_id' => $contractId,
        'user_id' => $userId,
        'type' => PoolTransaction::TYPE_DEPOSIT,
        'amount' => $amount,
        'currency' => 'PHP',
        'balance_after' => $amount,
        'status' => PoolTransaction::STATUS_COMPLETED,
        'description' => "Test deposit for {$type}",
        'processed_at' => now(),
    ]);

    return $payment;
}

// -------------------------------------------------------
// GET /api/pool/my-transactions
// -------------------------------------------------------

test('authenticated user can get their pool transactions', function () {
    createPooledPayment($this->owner1->id, $this->contract->id);

    $response = $this->actingAs($this->owner1)
        ->getJson('/api/pool/my-transactions');

    $response->assertStatus(200)
        ->assertJson(['success' => true])
        ->assertJsonPath('data.data.0.type', 'deposit');
});

test('user only sees their own transactions', function () {
    createPooledPayment($this->owner1->id, $this->contract->id);
    createPooledPayment($this->owner2->id, $this->contract->id);

    $response = $this->actingAs($this->owner1)
        ->getJson('/api/pool/my-transactions');

    $response->assertStatus(200);
    $data = $response->json('data.data');
    expect($data)->toHaveCount(1);
    expect($data[0]['user_id'])->toBe($this->owner1->id);
});

test('transactions can be filtered by type', function () {
    createPooledPayment($this->owner1->id, $this->contract->id, Payment::TYPE_COLLATERAL);

    // Create a release transaction too
    PoolTransaction::create([
        'payment_id' => Payment::first()->id,
        'contract_id' => $this->contract->id,
        'user_id' => $this->owner1->id,
        'type' => PoolTransaction::TYPE_RELEASE,
        'amount' => 1000.00,
        'currency' => 'PHP',
        'balance_after' => 0,
        'status' => PoolTransaction::STATUS_COMPLETED,
        'description' => 'Test release',
        'processed_at' => now(),
    ]);

    $response = $this->actingAs($this->owner1)
        ->getJson('/api/pool/my-transactions?type=deposit');

    $response->assertStatus(200);
    $data = $response->json('data.data');
    expect($data)->toHaveCount(1);
    expect($data[0]['type'])->toBe('deposit');
});

test('unauthenticated user cannot access pool transactions', function () {
    $response = $this->getJson('/api/pool/my-transactions');

    $response->assertStatus(401);
});

// -------------------------------------------------------
// GET /api/pool/balance
// -------------------------------------------------------

test('user can get their pool balance', function () {
    createPooledPayment($this->owner1->id, $this->contract->id, 'collateral', 1000.00);

    $response = $this->actingAs($this->owner1)
        ->getJson('/api/pool/balance');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'total_deposited' => 1000.00,
            ],
        ]);
});

test('user with no transactions gets zero balance', function () {
    $response = $this->actingAs($this->owner1)
        ->getJson('/api/pool/balance');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'held' => 0,
                'frozen' => 0,
                'pending_deposits' => 0,
                'total_deposited' => 0,
                'total_released' => 0,
            ],
        ]);
});

// -------------------------------------------------------
// GET /api/pool/contracts/{contractId}/summary
// -------------------------------------------------------

test('contract party can view pool summary', function () {
    createPooledPayment($this->owner1->id, $this->contract->id);

    $response = $this->actingAs($this->owner1)
        ->getJson("/api/pool/contracts/{$this->contract->id}/summary");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'contract_id' => $this->contract->id,
                'total_deposits' => 1000.00,
            ],
        ]);
});

test('non-party user cannot view contract pool summary', function () {
    $stranger = User::factory()->create();

    $response = $this->actingAs($stranger)
        ->getJson("/api/pool/contracts/{$this->contract->id}/summary");

    $response->assertStatus(404);
});

// -------------------------------------------------------
// POST /api/disputes
// -------------------------------------------------------

test('contract party can file a dispute', function () {
    createPooledPayment($this->owner1->id, $this->contract->id);

    $response = $this->actingAs($this->owner1)
        ->postJson('/api/disputes', [
            'contract_id' => $this->contract->id,
            'reason' => 'The breeding conditions were not met as agreed',
        ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Dispute raised successfully. Contract funds have been frozen pending review.',
        ]);

    $this->assertDatabaseHas('disputes', [
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'status' => Dispute::STATUS_OPEN,
    ]);

    // Funds should be frozen
    $transaction = PoolTransaction::where('contract_id', $this->contract->id)->first();
    expect($transaction->status)->toBe(PoolTransaction::STATUS_FROZEN);
});

test('dispute requires minimum reason length', function () {
    $response = $this->actingAs($this->owner1)
        ->postJson('/api/disputes', [
            'contract_id' => $this->contract->id,
            'reason' => 'Short',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['reason']);
});

test('cannot file duplicate dispute on same contract', function () {
    Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner2->id,
        'reason' => 'Existing active dispute reason',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $response = $this->actingAs($this->owner1)
        ->postJson('/api/disputes', [
            'contract_id' => $this->contract->id,
            'reason' => 'Trying to file another dispute here',
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'An active dispute already exists for this contract',
        ]);
});

test('cannot file dispute on non-accepted contract', function () {
    $this->contract->update(['status' => 'pending_review']);

    $response = $this->actingAs($this->owner1)
        ->postJson('/api/disputes', [
            'contract_id' => $this->contract->id,
            'reason' => 'Trying to dispute a pending contract',
        ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'message' => 'Disputes can only be raised on accepted or fulfilled contracts',
        ]);
});

test('stranger cannot file dispute on contract they are not part of', function () {
    $stranger = User::factory()->create();

    $response = $this->actingAs($stranger)
        ->postJson('/api/disputes', [
            'contract_id' => $this->contract->id,
            'reason' => 'I should not be able to do this',
        ]);

    $response->assertStatus(404);
});

// -------------------------------------------------------
// GET /api/disputes
// -------------------------------------------------------

test('user can list their disputes', function () {
    Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'My test dispute reason text',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $response = $this->actingAs($this->owner1)
        ->getJson('/api/disputes');

    $response->assertStatus(200)
        ->assertJson(['success' => true]);

    $data = $response->json('data.data');
    expect($data)->toHaveCount(1);
    expect($data[0]['raised_by'])->toBe($this->owner1->id);
});

test('user only sees their own disputes', function () {
    Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Owner1 dispute reason text',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $response = $this->actingAs($this->owner2)
        ->getJson('/api/disputes');

    $response->assertStatus(200);
    $data = $response->json('data.data');
    expect($data)->toHaveCount(0);
});

// -------------------------------------------------------
// GET /api/disputes/{id}
// -------------------------------------------------------

test('user can view their specific dispute', function () {
    $dispute = Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'View specific dispute reason text',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $response = $this->actingAs($this->owner1)
        ->getJson("/api/disputes/{$dispute->id}");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $dispute->id,
                'reason' => 'View specific dispute reason text',
            ],
        ]);
});

test('user cannot view another users dispute', function () {
    $dispute = Dispute::create([
        'contract_id' => $this->contract->id,
        'raised_by' => $this->owner1->id,
        'reason' => 'Private dispute reason text here',
        'status' => Dispute::STATUS_OPEN,
    ]);

    $response = $this->actingAs($this->owner2)
        ->getJson("/api/disputes/{$dispute->id}");

    $response->assertStatus(404);
});
