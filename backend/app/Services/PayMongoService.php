<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    private ?string $secretKey;

    private ?string $publicKey;

    private string $baseUrl;

    private bool $verifySsl;

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
        $this->publicKey = config('services.paymongo.public_key');
        $this->baseUrl = config('services.paymongo.base_url') ?? 'https://api.paymongo.com/v1';
        // In local development, SSL verification can be disabled if needed
        // Set PAYMONGO_VERIFY_SSL=false in .env to disable (NOT recommended for production)
        $this->verifySsl = config('services.paymongo.verify_ssl', true);
    }

    /**
     * Get a configured HTTP client for PayMongo API calls
     */
    private function getHttpClient(): PendingRequest
    {
        $client = Http::withBasicAuth($this->secretKey, '');

        // Disable SSL verification for local development if configured
        if (! $this->verifySsl) {
            $client = $client->withOptions(['verify' => false]);
            Log::warning('PayMongo SSL verification is disabled. This should only be used in local development.');
        }

        return $client;
    }

    /**
     * Check if PayMongo is properly configured
     */
    public function isConfigured(): bool
    {
        $configured = ! empty($this->secretKey)
            && $this->secretKey !== 'sk_test_your_secret_key_here'
            && ! empty($this->publicKey)
            && $this->publicKey !== 'pk_test_your_public_key_here';

        if (! $configured) {
            Log::warning('PayMongo configuration check failed', [
                'secret_key_set' => ! empty($this->secretKey),
                'secret_key_is_placeholder' => $this->secretKey === 'sk_test_your_secret_key_here',
                'public_key_set' => ! empty($this->publicKey),
                'public_key_is_placeholder' => $this->publicKey === 'pk_test_your_public_key_here',
            ]);
        }

        return $configured;
    }

    /**
     * Create a checkout session for payment
     */
    public function createCheckoutSession(array $params): array
    {
        // Check if PayMongo is configured
        if (! $this->isConfigured()) {
            Log::warning('PayMongo API keys not configured');

            return [
                'success' => false,
                'error' => 'Payment service not configured. Please set up PayMongo API keys in the backend .env file.',
            ];
        }

        $payload = [
            'data' => [
                'attributes' => [
                    'line_items' => [
                        [
                            'currency' => $params['currency'] ?? 'PHP',
                            'amount' => (int) ($params['amount'] * 100), // Convert to centavos
                            'name' => $params['name'] ?? 'Payment',
                            'quantity' => 1,
                            'description' => $params['description'] ?? null,
                        ],
                    ],
                    'payment_method_types' => $params['payment_methods'] ?? [
                        'gcash',
                        'card',
                        'paymaya',
                        'grab_pay',
                    ],
                    'success_url' => $params['success_url'],
                    'cancel_url' => $params['cancel_url'],
                    'description' => $params['description'] ?? null,
                    'reference_number' => $params['reference_number'] ?? null,
                ],
            ],
        ];

        // Add optional metadata
        if (isset($params['metadata'])) {
            $payload['data']['attributes']['metadata'] = $params['metadata'];
        }

        try {
            $response = $this->getHttpClient()
                ->post("{$this->baseUrl}/checkout_sessions", $payload);

            if ($response->successful()) {
                $data = $response->json()['data'];

                return [
                    'success' => true,
                    'checkout_id' => $data['id'],
                    'checkout_url' => $data['attributes']['checkout_url'],
                    'expires_at' => $data['attributes']['expires_at'] ?? null,
                ];
            }

            Log::error('PayMongo checkout creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            $errorMessage = 'Failed to create checkout session';
            $responseData = $response->json();
            if (isset($responseData['errors'][0]['detail'])) {
                $errorMessage = $responseData['errors'][0]['detail'];
            }

            return [
                'success' => false,
                'error' => $errorMessage,
            ];
        } catch (\Exception $e) {
            Log::error('PayMongo exception', ['message' => $e->getMessage()]);

            // Provide more specific error message for SSL issues
            if (str_contains($e->getMessage(), 'SSL certificate')) {
                return [
                    'success' => false,
                    'error' => 'SSL certificate error. For local development, add PAYMONGO_VERIFY_SSL=false to your .env file.',
                ];
            }

            return [
                'success' => false,
                'error' => 'Payment service temporarily unavailable. Please try again later.',
            ];
        }
    }

    /**
     * Retrieve a checkout session by ID
     */
    public function getCheckoutSession(string $checkoutId): array
    {
        try {
            $response = $this->getHttpClient()
                ->get("{$this->baseUrl}/checkout_sessions/{$checkoutId}");

            if ($response->successful()) {
                $data = $response->json()['data'];

                return [
                    'success' => true,
                    'data' => [
                        'id' => $data['id'],
                        'status' => $data['attributes']['status'],
                        'payment_intent_id' => $data['attributes']['payment_intent']['id'] ?? null,
                        'payments' => $data['attributes']['payments'] ?? [],
                        'checkout_url' => $data['attributes']['checkout_url'],
                    ],
                ];
            }

            return [
                'success' => false,
                'error' => 'Checkout session not found',
            ];
        } catch (\Exception $e) {
            Log::error('PayMongo get checkout exception', ['message' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => 'Payment service unavailable',
            ];
        }
    }

    /**
     * Retrieve a payment by ID
     */
    public function getPayment(string $paymentId): array
    {
        try {
            $response = $this->getHttpClient()
                ->get("{$this->baseUrl}/payments/{$paymentId}");

            if ($response->successful()) {
                $data = $response->json()['data'];

                return [
                    'success' => true,
                    'data' => [
                        'id' => $data['id'],
                        'amount' => $data['attributes']['amount'] / 100, // Convert from centavos
                        'status' => $data['attributes']['status'],
                        'source' => $data['attributes']['source'] ?? null,
                        'paid_at' => $data['attributes']['paid_at'] ?? null,
                    ],
                ];
            }

            return [
                'success' => false,
                'error' => 'Payment not found',
            ];
        } catch (\Exception $e) {
            Log::error('PayMongo get payment exception', ['message' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => 'Payment service unavailable',
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $webhookSecret = config('services.paymongo.webhook_secret');

        if (empty($webhookSecret)) {
            Log::warning('PayMongo webhook secret not configured');

            return false;
        }

        // PayMongo signature format: t=timestamp,te=test_signature,li=live_signature
        $parts = explode(',', $signature);
        $signatureData = [];

        foreach ($parts as $part) {
            [$key, $value] = explode('=', $part, 2);
            $signatureData[$key] = $value;
        }

        $timestamp = $signatureData['t'] ?? '';
        $testSignature = $signatureData['te'] ?? '';
        $liveSignature = $signatureData['li'] ?? '';

        // Use test signature in test mode, live signature in production
        $expectedSignature = str_starts_with($this->secretKey, 'sk_test_')
            ? $testSignature
            : $liveSignature;

        // Compute expected signature
        $signedPayload = "{$timestamp}.{$payload}";
        $computedSignature = hash_hmac('sha256', $signedPayload, $webhookSecret);

        return hash_equals($computedSignature, $expectedSignature);
    }

    /**
     * Get the public key for frontend use
     */
    public function getPublicKey(): string
    {
        return $this->publicKey;
    }
}
