<?php

use App\Models\User;
use App\Models\Pet;
use App\Models\MatchRequest;
use App\Models\Conversation;
use App\Models\Message;
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
});

test('user can send match request', function () {
    $response = $this->actingAs($this->user1)->postJson('/api/match-requests', [
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Match request sent successfully',
        ]);

    $this->assertDatabaseHas('match_requests', [
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'pending',
    ]);
});

test('user cannot send match request from another users pet', function () {
    $response = $this->actingAs($this->user1)->postJson('/api/match-requests', [
        'requester_pet_id' => $this->pet2->pet_id,
        'target_pet_id' => $this->pet1->pet_id,
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'You can only send match requests from your own pets',
        ]);
});

test('user cannot send match request to own pet', function () {
    $response = $this->actingAs($this->user1)->postJson('/api/match-requests', [
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet1->pet_id,
    ]);

    $response->assertStatus(400)
        ->assertJson([
            'success' => false,
            'message' => 'You cannot send a match request to your own pet',
        ]);
});

test('user cannot send duplicate match request', function () {
    MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user1)->postJson('/api/match-requests', [
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
    ]);

    $response->assertStatus(409)
        ->assertJson([
            'success' => false,
            'message' => 'A match request already exists between these pets',
        ]);
});

test('user can get incoming match requests', function () {
    MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user2)->getJson('/api/match-requests/incoming');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonCount(1, 'data');
});

test('user can accept match request', function () {
    $matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user2)->putJson("/api/match-requests/{$matchRequest->id}/accept");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Match request accepted',
        ]);

    $this->assertDatabaseHas('match_requests', [
        'id' => $matchRequest->id,
        'status' => 'accepted',
    ]);

    $this->assertDatabaseHas('conversations', [
        'match_request_id' => $matchRequest->id,
    ]);
});

test('user cannot accept match request for others pet', function () {
    $matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user1)->putJson("/api/match-requests/{$matchRequest->id}/accept");

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'You can only accept match requests for your own pets',
        ]);
});

test('user can decline match request', function () {
    $matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->user2)->putJson("/api/match-requests/{$matchRequest->id}/decline");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'message' => 'Match request declined',
        ]);

    $this->assertDatabaseHas('match_requests', [
        'id' => $matchRequest->id,
        'status' => 'declined',
    ]);
});

test('user can get conversations', function () {
    $matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'accepted',
    ]);

    Conversation::create([
        'match_request_id' => $matchRequest->id,
    ]);

    $response = $this->actingAs($this->user1)->getJson('/api/conversations');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonCount(1, 'data');
});

test('user can send message in conversation', function () {
    $matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'accepted',
    ]);

    $conversation = Conversation::create([
        'match_request_id' => $matchRequest->id,
    ]);

    $response = $this->actingAs($this->user1)->postJson("/api/conversations/{$conversation->id}/messages", [
        'content' => 'Hello!',
    ]);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'message' => 'Message sent successfully',
        ]);

    $this->assertDatabaseHas('messages', [
        'conversation_id' => $conversation->id,
        'sender_id' => $this->user1->id,
        'content' => 'Hello!',
    ]);
});

test('user can get messages in conversation', function () {
    $matchRequest = MatchRequest::create([
        'requester_pet_id' => $this->pet1->pet_id,
        'target_pet_id' => $this->pet2->pet_id,
        'status' => 'accepted',
    ]);

    $conversation = Conversation::create([
        'match_request_id' => $matchRequest->id,
    ]);

    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $this->user1->id,
        'content' => 'Hello!',
    ]);

    $response = $this->actingAs($this->user2)->getJson("/api/conversations/{$conversation->id}/messages");

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    expect($response->json('data.messages'))->toHaveCount(1);
});
