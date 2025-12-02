<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PayMongoService;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    private PayMongoService $payMongoService;

    public function __construct(PayMongoService $payMongoService)
    {
        $this->payMongoService = $payMongoService;
    }

    /**
     * Create a checkout session for subscription
     */
    public function createCheckout(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|string|in:standard,premium',
            'billing_cycle' => 'required|string|in:monthly,yearly',
            'amount' => 'required|numeric|min:20',
            'success_url' => 'required|url',
            'cancel_url' => 'required|url',
        ]);

        $user = $request->user();

        // Verify amount matches expected plan pricing
        $expectedAmount = $this->getExpectedAmount($validated['plan_id'], $validated['billing_cycle']);
        if (abs($expectedAmount - $validated['amount']) > 0.01) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid subscription amount',
            ], 400);
        }

        // Check for existing pending subscription payment
        $existingPayment = Payment::where('user_id', $user->id)
            ->where('payment_type', Payment::TYPE_SUBSCRIPTION)
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

        // Create description
        $planName = ucfirst($validated['plan_id']);
        $cycleLabel = $validated['billing_cycle'] === 'monthly' ? 'Monthly' : 'Yearly';
        $description = "PawLink {$planName} Subscription - {$cycleLabel}";

        // Create PayMongo checkout session
        $result = $this->payMongoService->createCheckoutSession([
            'amount' => $validated['amount'],
            'currency' => 'PHP',
            'name' => $description,
            'description' => $description,
            'success_url' => $validated['success_url'],
            'cancel_url' => $validated['cancel_url'],
            'reference_number' => "SUB-{$user->id}-{$validated['plan_id']}-{$validated['billing_cycle']}",
            'metadata' => [
                'user_id' => $user->id,
                'plan_id' => $validated['plan_id'],
                'billing_cycle' => $validated['billing_cycle'],
                'type' => 'subscription',
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
            'contract_id' => null,
            'payment_type' => Payment::TYPE_SUBSCRIPTION,
            'amount' => $validated['amount'],
            'currency' => 'PHP',
            'description' => $description,
            'paymongo_checkout_id' => $result['checkout_id'],
            'paymongo_checkout_url' => $result['checkout_url'],
            'status' => Payment::STATUS_AWAITING_PAYMENT,
            'expires_at' => $result['expires_at'] ? \Carbon\Carbon::parse($result['expires_at']) : now()->addHour(),
            'metadata' => [
                'plan_id' => $validated['plan_id'],
                'billing_cycle' => $validated['billing_cycle'],
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
     * Get available subscription plans
     */
    public function getPlans()
    {
        $plans = [
            [
                'id' => 'standard',
                'name' => 'Standard',
                'monthly_price' => 199,
                'yearly_price' => 1990,
                'features' => [
                    'Up to 3 pet profiles',
                    'Basic matching algorithm',
                    'Standard support',
                    'Access to all pets',
                    'View shooter profiles',
                ],
            ],
            [
                'id' => 'premium',
                'name' => 'Premium',
                'monthly_price' => 499,
                'yearly_price' => 4990,
                'features' => [
                    'Unlimited pet profiles',
                    'Advanced AI matching',
                    'Priority support',
                    'Featured pet listings',
                    'Verified badge',
                    'Analytics dashboard',
                    'Contract templates',
                    'Direct shooter booking',
                ],
                'highlighted' => true,
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $plans,
        ]);
    }

    /**
     * Get expected subscription amount
     */
    private function getExpectedAmount(string $planId, string $billingCycle): float
    {
        $prices = [
            'standard' => [
                'monthly' => 199,
                'yearly' => 1990,
            ],
            'premium' => [
                'monthly' => 499,
                'yearly' => 4990,
            ],
        ];

        return (float) ($prices[$planId][$billingCycle] ?? 0);
    }
}
