<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\LitterController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\ShooterController;
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

        // Verification routes
        Route::post('/verification/submit', [VerificationController::class, 'submitVerification']);
        Route::get('/verification/status/{userId}', [VerificationController::class, 'getVerificationStatus']);
        Route::get('/verification/pending', [VerificationController::class, 'getPendingVerifications']);
        Route::put('/verification/{authId}/status', [VerificationController::class, 'updateVerificationStatus']);
    });
