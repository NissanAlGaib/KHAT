<?php

namespace App\Http\Controllers;

use App\Models\BreedingContract;
use App\Models\Payment;
use App\Models\Pet;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private PayMongoService $payMongoService;

    public function __construct(PayMongoService $payMongoService)
    {
        $this->payMongoService = $payMongoService;
    }

    /**
     * Create a checkout session for a payment
     */
    public function createCheckout(Request $request)
    {
        $validated = $request->validate([
            'contract_id' => 'required|integer|exists:breeding_contracts,id',
            'payment_type' => 'required|in:collateral,shooter_payment,monetary_compensation,shooter_collateral',
            'amount' => 'required|numeric|min:20', // PayMongo minimum is 20 PHP
            'success_url' => 'required|url',
            'cancel_url' => 'required|url',
        ]);

        $user = $request->user();
        $contract = BreedingContract::with('conversation.matchRequest.requesterPet', 'conversation.matchRequest.targetPet')
            ->find($validated['contract_id']);

        // Verify user has access to this contract
        if (! $this->userHasAccessToContract($user, $contract)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this contract',
            ], 403);
        }

        // Verify amount matches contract terms
        $expectedAmount = $this->getExpectedAmount($contract, $validated['payment_type'], $user);
        if ($expectedAmount === null || abs($expectedAmount - $validated['amount']) > 0.01) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid payment amount for this payment type',
            ], 400);
        }

        // Check for existing pending payment
        $existingPayment = Payment::where('user_id', $user->id)
            ->where('contract_id', $contract->id)
            ->where('payment_type', $validated['payment_type'])
            ->whereIn('status', [Payment::STATUS_PENDING, Payment::STATUS_AWAITING_PAYMENT])
            ->first();

        if ($existingPayment) {
            // Return existing checkout URL if still valid
            if ($existingPayment->expires_at && $existingPayment->expires_at > now()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'payment_id' => $existingPayment->id,
                        'checkout_url' => $existingPayment->paymongo_checkout_url,
                        'expires_at' => $existingPayment->expires_at->toISOString(),
                    ],
                ]);
            }
            // Mark expired payment as expired
            $existingPayment->update(['status' => Payment::STATUS_EXPIRED]);
        }

        // Create description based on payment type
        $description = $this->getPaymentDescription($validated['payment_type'], $contract);

        // Create PayMongo checkout session
        $result = $this->payMongoService->createCheckoutSession([
            'amount' => $validated['amount'],
            'currency' => 'PHP',
            'name' => $description,
            'description' => $description,
            'success_url' => $validated['success_url'],
            'cancel_url' => $validated['cancel_url'],
            'reference_number' => "CONTRACT-{$contract->id}-{$validated['payment_type']}-{$user->id}",
            'metadata' => [
                'user_id' => $user->id,
                'contract_id' => $contract->id,
                'payment_type' => $validated['payment_type'],
            ],
        ]);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['error'] ?? 'Failed to create payment session',
            ], 500);
        }

        // Create payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'contract_id' => $contract->id,
            'payment_type' => $validated['payment_type'],
            'amount' => $validated['amount'],
            'currency' => 'PHP',
            'description' => $description,
            'paymongo_checkout_id' => $result['checkout_id'],
            'paymongo_checkout_url' => $result['checkout_url'],
            'status' => Payment::STATUS_AWAITING_PAYMENT,
            'expires_at' => $result['expires_at'] ? \Carbon\Carbon::parse($result['expires_at']) : now()->addHour(),
            'metadata' => [
                'payment_type' => $validated['payment_type'],
            ],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checkout session created successfully',
            'data' => [
                'payment_id' => $payment->id,
                'checkout_url' => $result['checkout_url'],
                'expires_at' => $payment->expires_at->toISOString(),
            ],
        ]);
    }

    /**
     * Verify payment status
     */
    public function verifyPayment(Request $request, $paymentId)
    {
        $user = $request->user();
        $payment = Payment::where('id', $paymentId)
            ->where('user_id', $user->id)
            ->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found',
            ], 404);
        }

        // If already paid, return success
        if ($payment->isPaid()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                    'paid_at' => $payment->paid_at?->toISOString(),
                ],
            ]);
        }

        // Check with PayMongo
        if ($payment->paymongo_checkout_id) {
            $result = $this->payMongoService->getCheckoutSession($payment->paymongo_checkout_id);

            if ($result['success']) {
                $checkoutStatus = $result['data']['status'];

                if ($checkoutStatus === 'active') {
                    // Payment completed
                    $paymentIds = collect($result['data']['payments'] ?? [])->pluck('id')->first();
                    $payment->markAsPaid($paymentIds);

                    // Update contract if applicable
                    $this->updateContractPaymentStatus($payment);

                    return response()->json([
                        'success' => true,
                        'data' => [
                            'payment_id' => $payment->id,
                            'status' => 'paid',
                            'paid_at' => $payment->paid_at?->toISOString(),
                        ],
                    ]);
                }

                if ($checkoutStatus === 'expired') {
                    $payment->update(['status' => Payment::STATUS_EXPIRED]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ],
        ]);
    }

    /**
     * Get payment history for user
     */
    public function getPayments(Request $request)
    {
        $user = $request->user();

        $payments = Payment::where('user_id', $user->id)
            ->with('contract')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Get payments for a specific contract
     */
    public function getContractPayments(Request $request, $contractId)
    {
        $user = $request->user();
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id');

        // Verify user has access to this contract
        $contract = BreedingContract::whereHas('conversation.matchRequest', function ($query) use ($userPetIds) {
            $query->where(function ($q) use ($userPetIds) {
                $q->whereIn('requester_pet_id', $userPetIds)
                    ->orWhereIn('target_pet_id', $userPetIds);
            });
        })
            ->orWhere('shooter_user_id', $user->id)
            ->find($contractId);

        if (! $contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found or you do not have access',
            ], 404);
        }

        $payments = Payment::where('contract_id', $contractId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Handle PayMongo webhook
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Paymongo-Signature');

        // Verify signature
        if (! $this->payMongoService->verifyWebhookSignature($payload, $signature)) {
            Log::warning('Invalid PayMongo webhook signature');

            return response()->json(['error' => 'Invalid signature'], 400);
        }

        $data = json_decode($payload, true);
        $eventType = $data['data']['attributes']['type'] ?? null;
        $eventData = $data['data']['attributes']['data'] ?? null;

        Log::info('PayMongo webhook received', ['type' => $eventType]);

        switch ($eventType) {
            case 'checkout_session.payment.paid':
                $this->handleCheckoutPaid($eventData);
                break;

            case 'payment.paid':
                $this->handlePaymentPaid($eventData);
                break;

            case 'payment.failed':
                $this->handlePaymentFailed($eventData);
                break;
        }

        return response()->json(['success' => true]);
    }

    /**
     * Handle checkout session paid event
     */
    private function handleCheckoutPaid(array $data): void
    {
        $checkoutId = $data['id'] ?? null;
        if (! $checkoutId) {
            return;
        }

        $payment = Payment::where('paymongo_checkout_id', $checkoutId)->first();
        if (! $payment) {
            Log::warning('Payment not found for checkout', ['checkout_id' => $checkoutId]);

            return;
        }

        $paymentId = $data['attributes']['payments'][0]['id'] ?? null;
        $payment->markAsPaid($paymentId);

        // Update contract payment status
        $this->updateContractPaymentStatus($payment);

        Log::info('Payment marked as paid via webhook', ['payment_id' => $payment->id]);
    }

    /**
     * Handle payment paid event
     */
    private function handlePaymentPaid(array $data): void
    {
        $paymentIntentId = $data['attributes']['payment_intent_id'] ?? null;
        if (! $paymentIntentId) {
            return;
        }

        $payment = Payment::where('paymongo_payment_intent_id', $paymentIntentId)->first();
        if ($payment && ! $payment->isPaid()) {
            $payment->markAsPaid($data['id']);
            $this->updateContractPaymentStatus($payment);
        }
    }

    /**
     * Handle payment failed event
     */
    private function handlePaymentFailed(array $data): void
    {
        $paymentIntentId = $data['attributes']['payment_intent_id'] ?? null;
        if (! $paymentIntentId) {
            return;
        }

        $payment = Payment::where('paymongo_payment_intent_id', $paymentIntentId)->first();
        if ($payment) {
            $payment->update(['status' => Payment::STATUS_FAILED]);
            Log::info('Payment marked as failed via webhook', ['payment_id' => $payment->id]);
        }
    }

    /**
     * Update contract based on payment completion
     */
    private function updateContractPaymentStatus(Payment $payment): void
    {
        if (! $payment->contract_id) {
            return;
        }

        $contract = BreedingContract::find($payment->contract_id);
        if (! $contract) {
            return;
        }

        switch ($payment->payment_type) {
            case Payment::TYPE_COLLATERAL:
                // Could track owner collateral payment here
                Log::info('Collateral payment received', [
                    'contract_id' => $contract->id,
                    'user_id' => $payment->user_id,
                ]);
                break;

            case Payment::TYPE_SHOOTER_COLLATERAL:
                $contract->update(['shooter_collateral_paid' => true]);
                Log::info('Shooter collateral payment received', [
                    'contract_id' => $contract->id,
                ]);
                break;

            case Payment::TYPE_SHOOTER_PAYMENT:
                // Could track shooter payment status
                Log::info('Shooter payment received', [
                    'contract_id' => $contract->id,
                ]);
                break;
        }
    }

    /**
     * Check if user has access to contract
     */
    private function userHasAccessToContract($user, BreedingContract $contract): bool
    {
        $userPetIds = Pet::where('user_id', $user->id)->pluck('pet_id')->toArray();
        $matchRequest = $contract->conversation->matchRequest;

        // Check if user is an owner
        if (
            in_array($matchRequest->requester_pet_id, $userPetIds) ||
            in_array($matchRequest->target_pet_id, $userPetIds)
        ) {
            return true;
        }

        // Check if user is the shooter
        if ($contract->shooter_user_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Get expected payment amount based on payment type
     */
    private function getExpectedAmount(BreedingContract $contract, string $paymentType, $user): ?float
    {
        return match ($paymentType) {
            Payment::TYPE_COLLATERAL => (float) $contract->collateral_per_owner,
            Payment::TYPE_SHOOTER_COLLATERAL => (float) $contract->shooter_collateral,
            Payment::TYPE_SHOOTER_PAYMENT => (float) $contract->shooter_payment,
            Payment::TYPE_MONETARY_COMPENSATION => (float) $contract->monetary_amount,
            default => null,
        };
    }

    /**
     * Get payment description based on type
     */
    private function getPaymentDescription(string $paymentType, BreedingContract $contract): string
    {
        return match ($paymentType) {
            Payment::TYPE_COLLATERAL => "Breeding Contract Collateral - Contract #{$contract->id}",
            Payment::TYPE_SHOOTER_COLLATERAL => "Shooter Collateral - Contract #{$contract->id}",
            Payment::TYPE_SHOOTER_PAYMENT => "Shooter Service Payment - Contract #{$contract->id}",
            Payment::TYPE_MONETARY_COMPENSATION => "Breeding Compensation - Contract #{$contract->id}",
            default => "Payment - Contract #{$contract->id}",
        };
    }
}
