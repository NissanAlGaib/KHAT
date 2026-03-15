<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HealthRecord;
use App\Models\MatchRequest;
use App\Models\Payment;
use App\Models\Pet;
use App\Models\User;
use App\Models\UserAuth;
use App\Models\Vaccination;
use App\Models\VaccinationShot;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TestingToolsController extends Controller
{
    /**
     * Show the Testing Tools dashboard page.
     */
    public function index()
    {
        $petsOnCooldown = Pet::whereNotNull('cooldown_until')
            ->where('cooldown_until', '>', Carbon::now())
            ->with('owner:id,name')
            ->orderBy('cooldown_until', 'asc')
            ->get();

        $suspendedUsers = User::where('status', 'suspended')
            ->whereNotNull('suspension_end_date')
            ->where('suspension_end_date', '>', Carbon::now())
            ->orderBy('suspension_end_date', 'asc')
            ->get();

        $suspendedPets = Pet::whereIn('status', ['disabled', 'banned'])
            ->whereNotNull('suspension_end_date')
            ->where('suspension_end_date', '>', Carbon::now())
            ->with('owner:id,name')
            ->orderBy('suspension_end_date', 'asc')
            ->get();

        $expiringPayments = Payment::whereNotNull('expires_at')
            ->where('expires_at', '>', Carbon::now())
            ->where('status', 'paid')
            ->orderBy('expires_at', 'asc')
            ->limit(50)
            ->get();

        $expiringUserAuthDocs = UserAuth::whereNotNull('expiry_date')
            ->whereDate('expiry_date', '>', Carbon::today())
            ->with('user:id,name')
            ->orderBy('expiry_date', 'asc')
            ->limit(50)
            ->get();

        $expiringVaccinations = Vaccination::whereNotNull('expiration_date')
            ->whereDate('expiration_date', '>', Carbon::today())
            ->with(['pet:pet_id,user_id,name', 'pet.owner:id,name'])
            ->orderBy('expiration_date', 'asc')
            ->limit(50)
            ->get();

        $expiringHealthRecords = HealthRecord::whereNotNull('expiration_date')
            ->whereDate('expiration_date', '>', Carbon::today())
            ->with(['pet:pet_id,user_id,name', 'pet.owner:id,name'])
            ->orderBy('expiration_date', 'asc')
            ->limit(50)
            ->get();

        $expiringVaccinationShots = VaccinationShot::whereNotNull('expiration_date')
            ->whereDate('expiration_date', '>', Carbon::today())
            ->whereIn('verification_status', [
                VaccinationShot::VERIFICATION_APPROVED,
                VaccinationShot::VERIFICATION_HISTORICAL,
            ])
            ->with([
                'card:card_id,pet_id,vaccine_name,vaccine_type',
                'card.pet:pet_id,user_id,name',
                'card.pet.owner:id,name',
            ])
            ->orderBy('expiration_date', 'asc')
            ->limit(50)
            ->get();

        $recentMatchRequests = MatchRequest::with(['requesterPet:pet_id,name', 'targetPet:pet_id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return view('admin.testing-tools', compact(
            'petsOnCooldown',
            'suspendedUsers',
            'suspendedPets',
            'expiringPayments',
            'expiringUserAuthDocs',
            'expiringVaccinations',
            'expiringHealthRecords',
            'expiringVaccinationShots',
            'recentMatchRequests'
        ));
    }

    // =========================================================================
    // PET COOLDOWN MANAGEMENT
    // =========================================================================

    /**
     * Clear a pet's cooldown immediately.
     */
    public function clearPetCooldown(Request $request, $petId)
    {
        $pet = Pet::findOrFail($petId);
        $previousCooldown = $pet->cooldown_until;

        $pet->clearCooldown();

        Log::info('Admin cleared pet cooldown', [
            'admin_id' => Auth::id(),
            'pet_id' => $petId,
            'pet_name' => $pet->name,
            'previous_cooldown' => $previousCooldown,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Cooldown cleared for {$pet->name}.",
            ]);
        }

        return back()->with('success', "Cooldown cleared for {$pet->name}.");
    }

    /**
     * Fast-forward a pet's cooldown to expire sooner.
     */
    public function fastForwardPetCooldown(Request $request, $petId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $pet = Pet::findOrFail($petId);

        if (!$pet->cooldown_until || $pet->cooldown_until->isPast()) {
            $message = "{$pet->name} is not currently on cooldown.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newCooldown = $pet->cooldown_until->subDays($request->days);

        // If fast-forwarding past now, just clear it
        if ($newCooldown->isPast()) {
            $pet->clearCooldown();
            $message = "Cooldown for {$pet->name} has been fast-forwarded past current date and cleared.";
        } else {
            $pet->update(['cooldown_until' => $newCooldown]);
            $message = "Cooldown for {$pet->name} moved forward by {$request->days} days. Expires: {$newCooldown->format('M d, Y')}";
        }

        Log::info('Admin fast-forwarded pet cooldown', [
            'admin_id' => Auth::id(),
            'pet_id' => $petId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    // =========================================================================
    // BREEDING HISTORY RESET
    // =========================================================================

    /**
     * Reset a pet's breeding history (has_been_bred, breeding_count).
     */
    public function resetBreedingHistory(Request $request, $petId)
    {
        $pet = Pet::findOrFail($petId);

        $pet->update([
            'has_been_bred' => false,
            'breeding_count' => 0,
        ]);

        Log::info('Admin reset pet breeding history', [
            'admin_id' => Auth::id(),
            'pet_id' => $petId,
            'pet_name' => $pet->name,
        ]);

        $message = "Breeding history reset for {$pet->name} (has_been_bred=false, breeding_count=0).";

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Full pet reset: clear cooldown + reset breeding history.
     */
    public function resetPetFull(Request $request, $petId)
    {
        $pet = Pet::findOrFail($petId);

        $pet->update([
            'has_been_bred' => false,
            'breeding_count' => 0,
            'cooldown_until' => null,
        ]);

        Log::info('Admin performed full pet reset', [
            'admin_id' => Auth::id(),
            'pet_id' => $petId,
            'pet_name' => $pet->name,
        ]);

        $message = "Full reset for {$pet->name}: cooldown cleared, breeding history reset.";

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    // =========================================================================
    // MATCH REQUEST MANAGEMENT
    // =========================================================================

    /**
     * Delete/reset match requests between a specific pet pair.
     */
    public function resetMatchRequests(Request $request)
    {
        $request->validate([
            'pet_id_1' => 'required|integer|exists:pets,pet_id',
            'pet_id_2' => 'required|integer|exists:pets,pet_id',
        ]);

        $petId1 = $request->pet_id_1;
        $petId2 = $request->pet_id_2;

        $deleted = MatchRequest::where(function ($query) use ($petId1, $petId2) {
            $query->where('requester_pet_id', $petId1)->where('target_pet_id', $petId2);
        })->orWhere(function ($query) use ($petId1, $petId2) {
            $query->where('requester_pet_id', $petId2)->where('target_pet_id', $petId1);
        })->delete();

        Log::info('Admin reset match requests between pets', [
            'admin_id' => Auth::id(),
            'pet_id_1' => $petId1,
            'pet_id_2' => $petId2,
            'deleted_count' => $deleted,
        ]);

        $pet1 = Pet::find($petId1);
        $pet2 = Pet::find($petId2);
        $message = "Deleted {$deleted} match request(s) between {$pet1->name} (#{$petId1}) and {$pet2->name} (#{$petId2}).";

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message, 'deleted_count' => $deleted])
            : back()->with('success', $message);
    }

    /**
     * Delete all match requests for a specific pet.
     */
    public function resetAllMatchRequestsForPet(Request $request, $petId)
    {
        $pet = Pet::findOrFail($petId);

        $deleted = MatchRequest::where('requester_pet_id', $petId)
            ->orWhere('target_pet_id', $petId)
            ->delete();

        Log::info('Admin reset all match requests for pet', [
            'admin_id' => Auth::id(),
            'pet_id' => $petId,
            'pet_name' => $pet->name,
            'deleted_count' => $deleted,
        ]);

        $message = "Deleted {$deleted} match request(s) for {$pet->name}.";

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message, 'deleted_count' => $deleted])
            : back()->with('success', $message);
    }

    // =========================================================================
    // SUBSCRIPTION / PAYMENT EXPIRY
    // =========================================================================

    /**
     * Fast-forward a user's suspension end date.
     */
    public function fastForwardSuspension(Request $request, $userId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $user = User::findOrFail($userId);

        if ($user->status !== 'suspended' || !$user->suspension_end_date) {
            $message = "User {$user->name} is not currently suspended with an end date.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newEndDate = Carbon::parse($user->suspension_end_date)->subDays($request->days);

        if ($newEndDate->isPast()) {
            // Lift suspension entirely
            $user->update([
                'status' => 'active',
                'suspension_end_date' => null,
                'suspension_reason' => null,
                'suspended_at' => null,
            ]);
            $message = "Suspension for {$user->name} has been fast-forwarded and lifted.";
        } else {
            $user->update(['suspension_end_date' => $newEndDate]);
            $message = "Suspension for {$user->name} moved forward by {$request->days} days. Ends: {$newEndDate->format('M d, Y')}";
        }

        Log::info('Admin fast-forwarded user suspension', [
            'admin_id' => Auth::id(),
            'user_id' => $userId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Fast-forward a pet's suspension end date.
     */
    public function fastForwardPetSuspension(Request $request, $petId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $pet = Pet::findOrFail($petId);

        if (!$pet->suspension_end_date) {
            $message = "Pet {$pet->name} has no suspension end date.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newEndDate = Carbon::parse($pet->suspension_end_date)->subDays($request->days);

        if ($newEndDate->isPast()) {
            $pet->update([
                'status' => 'active',
                'suspension_end_date' => null,
                'suspension_reason' => null,
                'suspended_at' => null,
            ]);
            $message = "Suspension for {$pet->name} has been fast-forwarded and lifted.";
        } else {
            $pet->update(['suspension_end_date' => $newEndDate]);
            $message = "Suspension for {$pet->name} moved forward by {$request->days} days. Ends: {$newEndDate->format('M d, Y')}";
        }

        Log::info('Admin fast-forwarded pet suspension', [
            'admin_id' => Auth::id(),
            'pet_id' => $petId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Fast-forward a payment's expiry date.
     */
    public function fastForwardPaymentExpiry(Request $request, $paymentId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $payment = Payment::findOrFail($paymentId);

        if (!$payment->expires_at) {
            $message = "Payment #{$paymentId} has no expiry date.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newExpiry = Carbon::parse($payment->expires_at)->subDays($request->days);
        $payment->update(['expires_at' => $newExpiry]);

        $message = "Payment #{$paymentId} expiry moved forward by {$request->days} days. New expiry: {$newExpiry->format('M d, Y H:i')}";

        Log::info('Admin fast-forwarded payment expiry', [
            'admin_id' => Auth::id(),
            'payment_id' => $paymentId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Fast-forward a user auth document expiry date.
     */
    public function fastForwardUserAuthExpiry(Request $request, $authId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $authRecord = UserAuth::findOrFail($authId);

        if (!$authRecord->expiry_date) {
            $message = "User auth record #{$authId} has no expiry date.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newExpiry = Carbon::parse($authRecord->expiry_date)->subDays($request->days);
        $authRecord->update(['expiry_date' => $newExpiry->toDateString()]);

        $message = "User auth #{$authId} expiry moved forward by {$request->days} days. New expiry: {$newExpiry->format('M d, Y')}";

        Log::info('Admin fast-forwarded user auth expiry', [
            'admin_id' => Auth::id(),
            'auth_id' => $authId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Fast-forward a vaccination record expiry date.
     */
    public function fastForwardVaccinationExpiry(Request $request, $vaccinationId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $vaccination = Vaccination::findOrFail($vaccinationId);

        if (!$vaccination->expiration_date) {
            $message = "Vaccination #{$vaccinationId} has no expiration date.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newExpiry = Carbon::parse($vaccination->expiration_date)->subDays($request->days);
        $vaccination->update(['expiration_date' => $newExpiry->toDateString()]);

        $message = "Vaccination #{$vaccinationId} expiry moved forward by {$request->days} days. New expiry: {$newExpiry->format('M d, Y')}";

        Log::info('Admin fast-forwarded vaccination expiry', [
            'admin_id' => Auth::id(),
            'vaccination_id' => $vaccinationId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Fast-forward a health record expiry date.
     */
    public function fastForwardHealthRecordExpiry(Request $request, $healthRecordId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $healthRecord = HealthRecord::findOrFail($healthRecordId);

        if (!$healthRecord->expiration_date) {
            $message = "Health record #{$healthRecordId} has no expiration date.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newExpiry = Carbon::parse($healthRecord->expiration_date)->subDays($request->days);
        $healthRecord->update(['expiration_date' => $newExpiry->toDateString()]);

        $message = "Health record #{$healthRecordId} expiry moved forward by {$request->days} days. New expiry: {$newExpiry->format('M d, Y')}";

        Log::info('Admin fast-forwarded health record expiry', [
            'admin_id' => Auth::id(),
            'health_record_id' => $healthRecordId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Fast-forward a vaccination shot expiry date.
     */
    public function fastForwardVaccinationShotExpiry(Request $request, $shotId)
    {
        $request->validate([
            'days' => 'required|integer|min:1',
        ]);

        $shot = VaccinationShot::findOrFail($shotId);

        if (!$shot->expiration_date) {
            $message = "Vaccination shot #{$shotId} has no expiration date.";
            return $request->expectsJson()
                ? response()->json(['success' => false, 'message' => $message], 400)
                : back()->with('error', $message);
        }

        $newExpiry = Carbon::parse($shot->expiration_date)->subDays($request->days);
        $shot->update(['expiration_date' => $newExpiry->toDateString()]);

        $message = "Vaccination shot #{$shotId} expiry moved forward by {$request->days} days. New expiry: {$newExpiry->format('M d, Y')}";

        Log::info('Admin fast-forwarded vaccination shot expiry', [
            'admin_id' => Auth::id(),
            'shot_id' => $shotId,
            'days_forwarded' => $request->days,
        ]);

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    /**
     * Expire a payment immediately.
     */
    public function expirePayment(Request $request, $paymentId)
    {
        $payment = Payment::findOrFail($paymentId);

        $payment->update(['expires_at' => Carbon::now()->subMinute()]);

        Log::info('Admin expired payment immediately', [
            'admin_id' => Auth::id(),
            'payment_id' => $paymentId,
        ]);

        $message = "Payment #{$paymentId} has been expired immediately.";

        return $request->expectsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }
}

