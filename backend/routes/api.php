<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BreedingContractController;
use App\Http\Controllers\LitterController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\MatchRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\ShooterController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware("guest")->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('guest')
        ->name('register');

    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('guest')
        ->name('login');
});

// PayMongo webhook (no auth required)
Route::post('/webhooks/paymongo', [PaymentController::class, 'handleWebhook']);

Route::middleware(['auth:sanctum'])
    ->group(function () {
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
            ->name('logout');

        Route::get('/user', function (Request $request) {
            return $request->user();
        });

        // User profile routes
        Route::get('/user/profile', [UserController::class, 'getProfile']);
        Route::post('/user/profile', [UserController::class, 'updateProfile']);
        Route::post('/user/profile-image', [UserController::class, 'updateProfileImage']);
        Route::get('/user/statistics', [UserController::class, 'getStatistics']);

        // Pet routes
        Route::get('/pets', [PetController::class, 'index']);
        Route::get('/pets/available', [PetController::class, 'getAvailablePets']);
        Route::post('/pets', [PetController::class, 'store']);
        Route::get('/pets/{id}', [PetController::class, 'show']);
        Route::get('/pets/{id}/profile', [PetController::class, 'getPublicProfile']);
        Route::post('/pets/{petId}/vaccinations/{vaccinationId}/resubmit', [PetController::class, 'resubmitVaccination']);
        Route::post('/pets/{petId}/health-records/{healthRecordId}/resubmit', [PetController::class, 'resubmitHealthRecord']);

        // Litter routes
        Route::get('/pets/{petId}/litters', [LitterController::class, 'getPetLitters']);
        Route::get('/litters/{litterId}', [LitterController::class, 'show']);
        Route::post('/litters', [LitterController::class, 'store']);

        // Match routes
        Route::get('/matches/potential', [MatchController::class, 'getPotentialMatches']);
        Route::get('/matches/top', [MatchController::class, 'getTopMatches']);

        // Shooter routes
        Route::get('/shooters', [ShooterController::class, 'index']);
        Route::get('/shooters/{id}', [ShooterController::class, 'show']);

        // Shooter offer routes (for shooters)
        Route::get('/shooter/offers', [ShooterController::class, 'getOffers']);
        Route::get('/shooter/offers/{id}', [ShooterController::class, 'getOfferDetails']);
        Route::put('/shooter/offers/{id}/accept', [ShooterController::class, 'acceptOffer']);
        Route::get('/shooter/my-offers', [ShooterController::class, 'getMyOffers']);

        // Debug routes for shooter offers
        Route::get('/shooter/debug/contracts', [ShooterController::class, 'debugContracts']);
        Route::post('/shooter/debug/fix-status', [ShooterController::class, 'fixShooterStatus']);

        // Verification routes
        Route::post('/verification/submit', [VerificationController::class, 'submitVerification']);
        Route::get('/verification/status/{userId}', [VerificationController::class, 'getVerificationStatus']);
        Route::get('/verification/pending', [VerificationController::class, 'getPendingVerifications']);
        Route::put('/verification/{authId}/status', [VerificationController::class, 'updateVerificationStatus']);
        Route::post('/verification/{authId}/resubmit', [VerificationController::class, 'resubmitVerification']);

        // Notification routes
        Route::get('/notifications', [NotificationController::class, 'getNotifications']);
        Route::get('/notifications/count', [NotificationController::class, 'getNotificationCount']);

        // Match request routes
        Route::post('/match-requests', [MatchRequestController::class, 'store']);
        Route::post('/match-requests/payment', [MatchRequestController::class, 'createMatchPayment']);
        Route::get('/match-requests/incoming', [MatchRequestController::class, 'incoming']);
        Route::get('/match-requests/outgoing', [MatchRequestController::class, 'outgoing']);
        Route::get('/match-requests/matches', [MatchRequestController::class, 'matches']);
        Route::put('/match-requests/{id}/accept', [MatchRequestController::class, 'accept']);
        Route::put('/match-requests/{id}/decline', [MatchRequestController::class, 'decline']);

        // Conversation routes
        Route::get('/conversations', [MatchRequestController::class, 'getConversations']);
        Route::get('/conversations/{id}/messages', [MatchRequestController::class, 'getMessages']);
        Route::post('/conversations/{id}/messages', [MatchRequestController::class, 'sendMessage']);

        // Breeding contract routes
        Route::post('/conversations/{id}/contracts', [BreedingContractController::class, 'store']);
        Route::get('/conversations/{id}/contracts', [BreedingContractController::class, 'show']);
        Route::put('/contracts/{id}', [BreedingContractController::class, 'update']);
        Route::put('/contracts/{id}/accept', [BreedingContractController::class, 'accept']);
        Route::put('/contracts/{id}/reject', [BreedingContractController::class, 'reject']);

        // Breeding completion and offspring routes
        Route::put('/contracts/{id}/complete-breeding', [BreedingContractController::class, 'completeBreeding']);
        Route::post('/contracts/{id}/offspring', [BreedingContractController::class, 'storeOffspring']);
        Route::get('/contracts/{id}/offspring', [BreedingContractController::class, 'getOffspring']);
        Route::get('/contracts/{id}/offspring/allocation-summary', [BreedingContractController::class, 'getOffspringAllocationSummary']);
        Route::put('/contracts/{id}/offspring/allocate', [BreedingContractController::class, 'allocateOffspring']);
        Route::post('/contracts/{id}/offspring/auto-allocate', [BreedingContractController::class, 'autoAllocateOffspring']);
        Route::post('/contracts/{id}/complete-match', [BreedingContractController::class, 'completeMatch']);

        // Daily report routes
        Route::post('/contracts/{id}/daily-reports', [BreedingContractController::class, 'storeDailyReport']);
        Route::get('/contracts/{id}/daily-reports', [BreedingContractController::class, 'getDailyReports']);

        // Shooter request routes (for owners)
        Route::get('/contracts/shooter-requests/count', [BreedingContractController::class, 'getPendingShooterRequestsCount']);
        Route::get('/contracts/{id}/shooter-request', [BreedingContractController::class, 'getShooterRequest']);
        Route::put('/contracts/{id}/shooter-request/accept', [BreedingContractController::class, 'acceptShooterRequest']);
        Route::put('/contracts/{id}/shooter-request/decline', [BreedingContractController::class, 'declineShooterRequest']);

        // Shooter contract management routes (for shooter to edit their terms and submit collateral)
        Route::get('/shooter/contracts/{id}', [BreedingContractController::class, 'getShooterContract']);
        Route::put('/shooter/contracts/{id}/terms', [BreedingContractController::class, 'shooterUpdateTerms']);
        Route::post('/shooter/contracts/{id}/collateral', [BreedingContractController::class, 'submitShooterCollateral']);

        // Payment routes
        Route::post('/payments/checkout', [PaymentController::class, 'createCheckout']);
        Route::get('/payments/{id}/verify', [PaymentController::class, 'verifyPayment']);
        Route::get('/payments', [PaymentController::class, 'getPayments']);
        Route::get('/contracts/{id}/payments', [PaymentController::class, 'getContractPayments']);

        // Subscription routes
        Route::get('/subscriptions/plans', [SubscriptionController::class, 'getPlans']);
        Route::post('/subscriptions/checkout', [SubscriptionController::class, 'createCheckout']);
    });
