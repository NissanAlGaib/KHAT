<?php

use App\Models\User;
use App\Models\Pet;
use App\Models\MatchRequest;
use App\Models\Conversation;
use App\Models\BreedingContract;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create two users with pets for testing
    $this->user1 = User::factory()->create();
    $this->user2 = User::factory()->create();

    $this->pet1 = Pet::create([
        'user_id' => $this->user1->id,
        'name' => 'Buddy',
        'species' => 'Dog',
        'breed' => 'Golden Retriever',
        'sex' => 'male',
        'birthdate' => now()->subYears(2),
        'height' => 60,
        'weight' => 30,
        'status' => 'active',
    ]);

    $this->pet2 = Pet::create([
        'user_id' => $this->user2->id,
        'name' => 'Luna',
        'species' => 'Dog',
        'breed' => 'Labrador',
        'sex' => 'female',
        'birthdate' => now()->subYears(1),
        'height' => 55,
        'weight' => 25,
        'status' => 'active',
    ]);

    // Create an accepted match request and conversation
    $this->matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'accepted',
    ]);

    $this->conversation = Conversation::create([
        'match_request_id' => $this->matchRequest->id,
    ]);
});

test('user can create a breeding contract', function () {
    $contractData = [
        'shooter_name' => 'John Doe',
        'shooter_payment' => 100.00,
        'shooter_location' => 'New York',
        'shooter_conditions' => 'Must be experienced',
        'end_contract_date' => now()->addMonths(3)->format('Y-m-d'),
        'include_monetary_amount' => true,
        'monetary_amount' => 500.00,
        'share_offspring' => true,
        'offspring_split_type' => 'percentage',
        'offspring_split_value' => 50,
        'offspring_selection_method' => 'first_pick',
        'include_goods_foods' => false,
        'collateral_total' => 1000.00,
        'pet_care_responsibilities' => 'Both owners share responsibilities',
        'harm_liability_terms' => 'Standard liability terms apply',
        'cancellation_policy' => 'Must notify 30 days in advance',
        'custom_terms' => 'Additional custom terms',
    ];

    $response = $this->actingAs($this->user1)->postJson(
        "/api/conversations/{$this->conversation->id}/contracts",
        $contractData
    );

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Contract created successfully',
        ]);

    $this->assertDatabaseHas('breeding_contracts', [
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
        'shooter_name' => 'John Doe',
    ]);
});

test('user cannot create duplicate contract for same conversation', function () {
    // Create first contract
    BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
    ]);

    // Try to create another
    $response = $this->actingAs($this->user2)->postJson(
        "/api/conversations/{$this->conversation->id}/contracts",
        []
    );

    $response->assertStatus(409)
        ->assertJson([
            'success' => false,
            'message' => 'A contract already exists for this conversation',
        ]);
});

test('user can get contract for conversation', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
        'shooter_name' => 'John Doe',
        'collateral_total' => 1000,
        'collateral_per_owner' => 500,
    ]);

    $response = $this->actingAs($this->user2)->getJson(
        "/api/conversations/{$this->conversation->id}/contracts"
    );

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $contract->id,
                'shooter_name' => 'John Doe',
                'can_edit' => true,
                'can_accept' => true,
                'is_creator' => false,
            ],
        ]);
});

test('receiving user can edit contract', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
        'shooter_payment' => 100,
    ]);

    $response = $this->actingAs($this->user2)->putJson(
        "/api/contracts/{$contract->id}",
        ['shooter_payment' => 150]
    );

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Contract updated successfully',
        ]);

    $this->assertDatabaseHas('breeding_contracts', [
        'id' => $contract->id,
        'shooter_payment' => 150,
        'last_edited_by' => $this->user2->id,
    ]);
});

test('creator cannot edit their own pending contract', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
    ]);

    $response = $this->actingAs($this->user1)->putJson(
        "/api/contracts/{$contract->id}",
        ['shooter_payment' => 150]
    );

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'You cannot edit this contract at this time. Wait for the other party to respond.',
        ]);
});

test('receiving user can accept contract', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
    ]);

    $response = $this->actingAs($this->user2)->putJson(
        "/api/contracts/{$contract->id}/accept"
    );

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Contract accepted successfully',
        ]);

    $this->assertDatabaseHas('breeding_contracts', [
        'id' => $contract->id,
        'status' => 'accepted',
    ]);
});

test('creator cannot accept their own initial contract', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
    ]);

    $response = $this->actingAs($this->user1)->putJson(
        "/api/contracts/{$contract->id}/accept"
    );

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'You cannot accept this contract. The other party must respond first.',
        ]);
});

test('creator can accept after receiving user edits', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'last_edited_by' => $this->user2->id,
        'status' => 'pending_review',
    ]);

    $response = $this->actingAs($this->user1)->putJson(
        "/api/contracts/{$contract->id}/accept"
    );

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Contract accepted successfully',
        ]);

    $this->assertDatabaseHas('breeding_contracts', [
        'id' => $contract->id,
        'status' => 'accepted',
    ]);
});

test('user can reject contract', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
    ]);

    $response = $this->actingAs($this->user2)->putJson(
        "/api/contracts/{$contract->id}/reject"
    );

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Contract rejected. The match has been ended.',
        ]);

    $this->assertDatabaseHas('breeding_contracts', [
        'id' => $contract->id,
        'status' => 'rejected',
    ]);
});

test('cannot reject already accepted contract', function () {
    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'accepted',
        'accepted_at' => now(),
    ]);

    $response = $this->actingAs($this->user2)->putJson(
        "/api/contracts/{$contract->id}/reject"
    );

    $response->assertStatus(400)
        ->assertJson([
            'success' => false,
            'message' => 'Cannot reject an already accepted contract',
        ]);
});

test('user without access cannot view contract', function () {
    $otherUser = User::factory()->create();

    $contract = BreedingContract::create([
        'conversation_id' => $this->conversation->id,
        'created_by' => $this->user1->id,
        'status' => 'pending_review',
    ]);

    $response = $this->actingAs($otherUser)->getJson(
        "/api/conversations/{$this->conversation->id}/contracts"
    );

    $response->assertStatus(404);
});

test('collateral is calculated correctly', function () {
    $response = $this->actingAs($this->user1)->postJson(
        "/api/conversations/{$this->conversation->id}/contracts",
        ['collateral_total' => 1000.00]
    );

    $response->assertStatus(201);

    $this->assertDatabaseHas('breeding_contracts', [
        'conversation_id' => $this->conversation->id,
        'collateral_total' => 1000.00,
        'collateral_per_owner' => 500.00,
    ]);
});
