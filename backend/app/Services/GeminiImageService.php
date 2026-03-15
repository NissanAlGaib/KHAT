<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiImageService
{
    private ?string $apiKey;

    private string $apiUrl;

    private string $imageModel;

    private string $visionModel;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->apiUrl = config('services.gemini.api_url', 'https://generativelanguage.googleapis.com/v1beta/openai');
        $this->imageModel = config('services.gemini.image_model', 'imagen-3.0-generate-002');
        $this->visionModel = config('services.gemini.vision_model', 'gemini-2.0-flash');
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
            /** @var Response $response */
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

    /**
     * Build a photo-driven offspring prompt by summarizing each parent's image set.
     *
     * @param  array<int, string>  $parentOnePhotoUrls
     * @param  array<int, string>  $parentTwoPhotoUrls
     * @param  array<string, mixed>  $context
     * @return array{success: bool, prompt?: string, parent_summaries?: array<string, string>, error?: string}
     */
    public function buildPhotoDrivenOffspringPrompt(array $parentOnePhotoUrls, array $parentTwoPhotoUrls, array $context = []): array
    {
        if (empty($this->apiKey)) {
            Log::warning('Gemini API key not configured for photo-driven offspring prompt');

            return [
                'success' => false,
                'error' => 'AI image service not configured.',
            ];
        }

        try {
            $parentOneSummary = $this->summarizeParentFromPhotos($parentOnePhotoUrls, 'Parent 1');
            $parentTwoSummary = $this->summarizeParentFromPhotos($parentTwoPhotoUrls, 'Parent 2');

            if (! ($parentOneSummary['success'] ?? false) || ! ($parentTwoSummary['success'] ?? false)) {
                return [
                    'success' => false,
                    'error' => $parentOneSummary['error'] ?? $parentTwoSummary['error'] ?? 'Photo-driven prompt generation unavailable.',
                    'parent_summaries' => array_filter([
                        'parent1' => $parentOneSummary['summary'] ?? null,
                        'parent2' => $parentTwoSummary['summary'] ?? null,
                    ]),
                ];
            }

            $species = trim((string) ($context['species'] ?? ''));
            $breed1 = trim((string) ($context['breed1'] ?? 'mixed')) ?: 'mixed';
            $breed2 = trim((string) ($context['breed2'] ?? 'mixed')) ?: 'mixed';

            $attributes = $context['attributes'] ?? [];
            $attributesText = is_array($attributes) && ! empty($attributes)
                ? implode(', ', array_map(static fn ($item): string => (string) $item, $attributes))
                : 'balanced inherited visual traits';

            $speciesPhrase = $species !== ''
                ? strtolower($species)
                : 'pet';

            $prompt = "Create a photorealistic {$speciesPhrase} offspring portrait that naturally blends inherited visual traits from two parents. "
                . "Parent 1 visual profile: {$parentOneSummary['summary']}. "
                . "Parent 2 visual profile: {$parentTwoSummary['summary']}. "
                . "Use breed context {$breed1} x {$breed2} and reflect these supporting traits where appropriate: {$attributesText}. "
                . 'Output one centered, high-detail offspring with realistic anatomy, natural fur texture, balanced trait inheritance from both parents, clean background, and soft studio lighting.';

            return [
                'success' => true,
                'prompt' => $prompt,
                'parent_summaries' => [
                    'parent1' => $parentOneSummary['summary'],
                    'parent2' => $parentTwoSummary['summary'],
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Failed to build photo-driven offspring prompt', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Photo-driven prompt generation unavailable.',
            ];
        }
    }

    /**
     * Summarize visual traits for one parent from one or more photo URLs.
     *
     * @param  array<int, string>  $photoUrls
     * @return array{success: bool, summary?: string, error?: string}
     */
    private function summarizeParentFromPhotos(array $photoUrls, string $parentLabel): array
    {
        $photoUrls = array_values(array_filter($photoUrls, static function ($url): bool {
            if (! is_string($url) || trim($url) === '') {
                return false;
            }

            return str_starts_with($url, 'http://') || str_starts_with($url, 'https://');
        }));

        if (empty($photoUrls)) {
            return [
                'success' => false,
                'error' => "{$parentLabel} has no usable photo URLs for analysis.",
            ];
        }

        $content = [
            [
                'type' => 'text',
                'text' => "Analyze these images of {$parentLabel} and provide one concise visual summary for pet offspring generation. Include coat/fur pattern, colors, ear shape, muzzle/face shape, eye characteristics, body build, and distinctive inherited visual markers. Return plain text only.",
            ],
        ];

        foreach ($photoUrls as $url) {
            $content[] = [
                'type' => 'image_url',
                'image_url' => [
                    'url' => $url,
                ],
            ];
        }

        try {
            /** @var Response $response */
            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->apiUrl}/chat/completions", [
                    'model' => $this->visionModel,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are an expert visual trait analyzer for pet images used in realistic offspring prompt design.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $content,
                        ],
                    ],
                    'temperature' => 0.3,
                ]);

            if (! $response->successful()) {
                Log::warning('Gemini parent photo summarization failed', [
                    'parent_label' => $parentLabel,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'Vision analysis request failed.',
                ];
            }

            $data = $response->json();
            $rawContent = $data['choices'][0]['message']['content'] ?? null;
            $summary = $this->extractMessageContent($rawContent);

            if ($summary === '') {
                Log::warning('Gemini parent photo summarization returned empty content', [
                    'parent_label' => $parentLabel,
                    'response' => $data,
                ]);

                return [
                    'success' => false,
                    'error' => 'Vision analysis returned an empty summary.',
                ];
            }

            return [
                'success' => true,
                'summary' => $summary,
            ];
        } catch (ConnectionException $e) {
            Log::error('Gemini parent photo summarization connection failed', [
                'parent_label' => $parentLabel,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Vision analysis service is currently unavailable.',
            ];
        } catch (\Exception $e) {
            Log::error('Gemini parent photo summarization failed unexpectedly', [
                'parent_label' => $parentLabel,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Failed to summarize parent photos.',
            ];
        }
    }

    /**
     * Normalize message content from either string or array-style chat responses.
     */
    private function extractMessageContent(mixed $content): string
    {
        if (is_string($content)) {
            return trim($content);
        }

        if (! is_array($content)) {
            return '';
        }

        $parts = [];

        foreach ($content as $chunk) {
            if (is_string($chunk)) {
                $parts[] = trim($chunk);
                continue;
            }

            if (! is_array($chunk)) {
                continue;
            }

            if (isset($chunk['text']) && is_string($chunk['text'])) {
                $parts[] = trim($chunk['text']);
                continue;
            }

            if (isset($chunk['type']) && $chunk['type'] === 'text' && isset($chunk['value']) && is_string($chunk['value'])) {
                $parts[] = trim($chunk['value']);
            }
        }

        $joined = trim(implode(' ', array_filter($parts, static fn ($part): bool => $part !== '')));

        return preg_replace('/\s+/', ' ', $joined) ?? '';
    }
}
