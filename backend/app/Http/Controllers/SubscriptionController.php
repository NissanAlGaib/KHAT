<?php

namespace App\Http\Controllers;

use App\Helpers\SubscriptionTierHelper;
use App\Models\Payment;
use App\Services\AnalyticsService;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            'plan_id' => 'required|string|in:basic,standard,premium',
            'billing_cycle' => 'required|string|in:monthly,yearly',
            'amount' => 'required|numeric|min:20',
            'success_url' => 'required|url',
            'cancel_url' => 'required|url',
        ]);

        $user = $request->user();
        $planId = $this->normalizePlanId($validated['plan_id']);

        // Verify amount matches expected plan pricing
        $expectedAmount = $this->getExpectedAmount($planId, $validated['billing_cycle']);
        if (abs($expectedAmount - $validated['amount']) > 0.01) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid subscription amount',
            ], 400);
        }

        // Check if PayMongo is configured
        if (! $this->payMongoService->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Payment service not configured. Please set up PayMongo API keys.',
            ], 503);
        }

        try {
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
            $planName = ucfirst($planId);
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
                'reference_number' => "SUB-{$user->id}-{$planId}-{$validated['billing_cycle']}",
                'metadata' => [
                    'user_id' => $user->id,
                    'plan_id' => $planId,
                    'billing_cycle' => $validated['billing_cycle'],
                    'source' => 'paymongo',
                    'type' => 'subscription',
                ],
            ]);

            if (! $result['success']) {
                Log::error('Subscription checkout failed', [
                    'user_id' => $user->id,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Failed to create payment session',
                ], 400);
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
                    'plan_id' => $planId,
                    'billing_cycle' => $validated['billing_cycle'],
                    'source' => 'paymongo',
                ],
            ]);

            AnalyticsService::track('subscription_checkout_initiated', [
                'plan_id' => $planId,
                'billing_cycle' => $validated['billing_cycle'],
                'amount' => (float) $validated['amount'],
                'currency' => 'PHP',
            ], $user->id, $payment->id);

            return response()->json([
                'success' => true,
                'message' => 'Checkout session created successfully',
                'data' => [
                    'payment_id' => $payment->id,
                    'checkout_url' => $result['checkout_url'],
                    'expires_at' => $payment->expires_at->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Subscription checkout exception', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request. Please try again.',
            ], 500);
        }
    }

    /**
     * Get available subscription plans
     */
    public function getPlans(Request $request)
    {
        $plans = [
            [
                'id' => 'standard',
                'name' => 'Standard',
                'monthly_price' => 199,
                'yearly_price' => 1990,
                'features' => [
                    'Up to 5 pet profiles',
                    '20 matches per month',
                    '5 AI generations per day',
                    'Standard support',
                    'Access to all pets',
                    'View shooter profiles',
                ],
                'highlighted' => false,
                'tier_level' => 1,
                'color_primary' => '#3B82F6',
                'color_secondary' => '#93C5FD',
                'icon' => 'star',
            ],
            [
                'id' => 'premium',
                'name' => 'Premium',
                'monthly_price' => 499,
                'yearly_price' => 4990,
                'features' => [
                    'Unlimited pet profiles',
                    'Unlimited matches',
                    '20 AI generations per day',
                    'Priority support',
                    'Featured pet listings',
                    'Verified badge',
                    'Analytics dashboard',
                    'Contract templates',
                    'Direct shooter booking',
                ],
                'highlighted' => true,
                'tier_level' => 2,
                'color_primary' => '#F59E0B',
                'color_secondary' => '#FCD34D',
                'icon' => 'award',
            ],
        ];

        // Include current subscription info if user is authenticated
        $currentSubscription = null;
        if ($user = $request->user()) {
            $tier = $this->normalizePlanId($user->subscription_tier ?? 'free');

            $currentSubscription = [
                'tier' => $tier,
                'expires_at' => $user->subscription_expires_at ?? null,
                'status' => $user->subscription_status ?? 'inactive',
                'billing_cycle' => $user->subscription_billing_cycle,
                'source' => $user->subscription_source,
                'is_active' => ($user->subscription_status ?? 'inactive') === 'active'
                    && in_array($tier, ['standard', 'premium'], true),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $plans,
            'payment_configured' => $this->payMongoService->isConfigured(),
            'current_subscription' => $currentSubscription,
        ]);
    }

    /**
     * Get current subscription state for the authenticated user.
     */
    public function getCurrentSubscription(Request $request)
    {
        $user = $request->user();
        $tier = $this->normalizePlanId($user->subscription_tier ?? 'free');

        $isActive = ($user->subscription_status ?? 'inactive') === 'active'
            && in_array($tier, ['standard', 'premium'], true);

        return response()->json([
            'success' => true,
            'data' => [
                'tier' => $tier,
                'status' => $user->subscription_status ?? 'inactive',
                'source' => $user->subscription_source,
                'billing_cycle' => $user->subscription_billing_cycle,
                'started_at' => $user->subscription_started_at,
                'expires_at' => $user->subscription_expires_at,
                'is_active' => $isActive,
            ],
        ]);
    }

    /**
     * Get expected subscription amount
     */
    private function getExpectedAmount(string $planId, string $billingCycle): float
    {
        $planId = $this->normalizePlanId($planId);

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

    /**
     * Keep plan IDs backward-compatible while preserving the public API shape.
     */
    private function normalizePlanId(?string $planId): string
    {
        if ($planId === null) {
            return 'free';
        }

        $normalized = SubscriptionTierHelper::toLegacy($planId);

        return $normalized === '' ? 'free' : $normalized;
    }
}
