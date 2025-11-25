<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminController;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Admin Routes
Route::prefix('admin')->group(function () {
    // Guest routes (not authenticated)
    Route::middleware('guest')->group(function () {
        Route::get('/login', [AdminController::class, 'showLoginForm'])->name('admin.login');
        Route::post('/login', [AdminController::class, 'login']);
    });

    // Authenticated admin routes
    Route::middleware('auth')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
        Route::post('/logout', [AdminController::class, 'logout'])->name('admin.logout');

        // User Management
        Route::get('/users', [AdminController::class, 'usersIndex'])->name('admin.users.index');
        Route::get('/users/{userId}/details', [AdminController::class, 'getUserDetails'])->name('admin.users.details');
        Route::post('/users/verification/{authId}/update', [AdminController::class, 'updateVerificationStatus'])->name('admin.users.verification.update');
        Route::delete('/users/{userId}', [AdminController::class, 'deleteUser'])->name('admin.users.delete');

        // Pet Management
        Route::get('/pets', [AdminController::class, 'petsIndex'])->name('admin.pets.index');
        Route::get('/pets/{petId}/details', [AdminController::class, 'petDetails'])->name('admin.pets.details');
        Route::post('/pets/{petId}/status', [AdminController::class, 'updatePetStatus'])->name('admin.pets.status.update');
        Route::delete('/pets/{petId}', [AdminController::class, 'deletePet'])->name('admin.pets.delete');

        // Litter/Match Management
        Route::get('/litters/{litterId}/details', [AdminController::class, 'litterDetails'])->name('admin.litters.details');

        // Other Admin Pages
        Route::get('/matches', [AdminController::class, 'matchHistory'])->name('admin.matches');
        Route::get('/analytics', [AdminController::class, 'analytics'])->name('admin.analytics');
        Route::get('/billing', [AdminController::class, 'billing'])->name('admin.billing');
        Route::get('/tickets', [AdminController::class, 'tickets'])->name('admin.tickets');
        Route::get('/audit-logs', [AdminController::class, 'auditLogs'])->name('admin.audit-logs');
        Route::get('/profile', [AdminController::class, 'profile'])->name('admin.profile');
        Route::get('/notifications', [AdminController::class, 'notifications'])->name('admin.notifications');
        Route::get('/settings', [AdminController::class, 'settings'])->name('admin.settings');
    });
});

require __DIR__ . '/auth.php';
