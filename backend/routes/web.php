<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\VaccineProtocolController;
use App\Http\Controllers\Admin\UserWarningController;

Route::get('/', function () {
    return redirect()->route('admin.login');
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
        Route::get('/users/{user}', [AdminController::class, 'userDetails'])->name('admin.users.show');
        Route::post('/users/{user}/status', [AdminController::class, 'updateUserStatus'])->name('admin.users.status');
        Route::get('/users/{userId}/details', [AdminController::class, 'getUserDetails'])->name('admin.users.details');
        Route::post('/users/verification/{authId}/update', [AdminController::class, 'updateVerificationStatus'])->name('admin.users.verification.update');
        Route::post('/users/{user}/warn', [UserWarningController::class, 'store'])->name('admin.users.warn');
        Route::delete('/users/{userId}', [AdminController::class, 'deleteUser'])->name('admin.users.delete');

        // Admin Management
        Route::get('/admins', [AdminController::class, 'adminsIndex'])->name('admin.admins.index');
        Route::post('/admins', [AdminController::class, 'storeAdmin'])->name('admin.admins.store');
        Route::delete('/admins/{userId}/revoke', [AdminController::class, 'revokeAdmin'])->name('admin.admins.revoke');

        // Pet Management
        Route::get('/pets', [AdminController::class, 'petsIndex'])->name('admin.pets.index');
        Route::get('/pets/{petId}/details', [AdminController::class, 'petDetails'])->name('admin.pets.details');
        Route::post('/pets/{petId}/status', [AdminController::class, 'updatePetStatus'])->name('admin.pets.status.update');
        Route::delete('/pets/{petId}', [AdminController::class, 'deletePet'])->name('admin.pets.delete');

        // Pet Document Management
        Route::post('/pets/vaccinations/{vaccinationId}/status', [AdminController::class, 'updateVaccinationStatus'])->name('admin.pets.vaccinations.status');
        Route::post('/pets/health-records/{healthRecordId}/status', [AdminController::class, 'updateHealthRecordStatus'])->name('admin.pets.health-records.status');

        // Litter/Match Management
        Route::get('/litters/{litterId}/details', [AdminController::class, 'litterDetails'])->name('admin.litters.details');

        // Vaccine Protocol Management
        Route::get('/vaccine-protocols', [VaccineProtocolController::class, 'index'])->name('admin.vaccine-protocols.index');
        Route::post('/vaccine-protocols', [VaccineProtocolController::class, 'store'])->name('admin.vaccine-protocols.store');
        Route::get('/vaccine-protocols/{id}/edit', [VaccineProtocolController::class, 'edit'])->name('admin.vaccine-protocols.edit');
        Route::put('/vaccine-protocols/{id}', [VaccineProtocolController::class, 'update'])->name('admin.vaccine-protocols.update');
        Route::patch('/vaccine-protocols/{id}/toggle', [VaccineProtocolController::class, 'toggleActive'])->name('admin.vaccine-protocols.toggle');

        // Vaccination Shot Verification
        Route::get('/vaccination-shots/pending', [VaccineProtocolController::class, 'pendingShots'])->name('admin.vaccination-shots.pending');
        Route::post('/vaccination-shots/{shotId}/approve', [VaccineProtocolController::class, 'approveShot'])->name('admin.vaccination-shots.approve');
        Route::post('/vaccination-shots/{shotId}/reject', [VaccineProtocolController::class, 'rejectShot'])->name('admin.vaccination-shots.reject');

        // Reports & Safety Management
        Route::get('/reports', [AdminController::class, 'reports'])->name('admin.reports');
        Route::get('/reports/{id}/details', [AdminController::class, 'getReportDetails'])->name('admin.reports.details');
        Route::put('/reports/{id}/review', [AdminController::class, 'reviewReport'])->name('admin.reports.review');
        Route::get('/blocks', [AdminController::class, 'blocks'])->name('admin.blocks');
        Route::delete('/blocks/{id}', [AdminController::class, 'forceUnblock'])->name('admin.blocks.destroy');

        // Other Admin Pages
        Route::get('/matches', [AdminController::class, 'matchHistory'])->name('admin.matches');
        Route::get('/analytics', [AdminController::class, 'analytics'])->name('admin.analytics');
        Route::get('/billing', [AdminController::class, 'billing'])->name('admin.billing');
        Route::get('/audit-logs', [AdminController::class, 'auditLogs'])->name('admin.audit-logs');
        Route::get('/profile', [AdminController::class, 'profile'])->name('admin.profile');
        Route::put('/profile', [AdminController::class, 'updateProfile'])->name('admin.profile.update');
        Route::get('/notifications', [AdminController::class, 'notifications'])->name('admin.notifications');
        Route::get('/settings', [AdminController::class, 'settings'])->name('admin.settings');
    });
});

require __DIR__ . '/auth.php';
