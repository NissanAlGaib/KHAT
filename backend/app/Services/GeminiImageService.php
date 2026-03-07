<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiImageService
{
    private ?string $apiKey;

    private string $apiUrl;

    private string $imageModel;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->apiUrl = config('services.gemini.api_url', 'https://generativelanguage.googleapis.com/v1beta/openai');
        $this->imageModel = config('services.gemini.image_model', 'imagen-3.0-generate-002');
    }

    /**
     * Generate an image from a text prompt using the Gemini API.
     *
     * @param  string  $prompt  The text prompt describing the image to generate.
     * @return array{success: bool, b64_json?: string, error?: string}
     */
    public function generateImage(string $prompt): array
    {
        if (empty($this->apiKey)) {
            Log::warning('Gemini API key not configured');

            return [
                'success' => false,
                'error' => 'AI image service not configured. Please set GEMINI_API_KEY in the backend .env file.',
            ];
        }

        try {
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/images/generations", [
                    'model' => $this->imageModel,
                    'prompt' => $prompt,
                    'response_format' => 'b64_json',
                    'n' => 1,
                    'size' => '1024x1024',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $b64Json = $data['data'][0]['b64_json'] ?? null;

                if (! $b64Json) {
                    Log::error('Gemini API returned success but no image data', [
                        'response' => $data,
                    ]);

                    return [
                        'success' => false,
                        'error' => 'AI service returned an unexpected response format.',
                    ];
                }

                return [
                    'success' => true,
                    'b64_json' => $b64Json,
                ];
            }

            $status = $response->status();

            Log::error('Gemini API returned error', [
                'status' => $status,
                'body' => $response->body(),
            ]);

            if ($status === 429) {
                return [
                    'success' => false,
                    'error' => 'AI service rate limit exceeded. Please try again later.',
                ];
            }

            return [
                'success' => false,
                'error' => 'AI image generation failed. Please try again later.',
            ];

        } catch (ConnectionException $e) {
            Log::error('Gemini API connection failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => 'AI image service is currently unavailable.',
            ];

        } catch (\Exception $e) {
            Log::error('Gemini image generation failed', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'error' => 'Something went wrong during AI image generation.',
            ];
        }
    }
}
