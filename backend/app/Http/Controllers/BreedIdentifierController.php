<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BreedIdentifierController extends Controller
{
    /**
     * Proxy breed identification request to the Python classifier API.
     */
    public function predict(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // Max 10MB
        ]);

        $breedApiUrl = config('services.breed_api.url', 'http://localhost:5000');

        try {
            $file = $request->file('image');

            $response = Http::timeout(30)
                ->attach(
                    'file',
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName()
                )
                ->post("{$breedApiUrl}/predict");

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::error('Breed API returned error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Breed identification service returned an error.',
            ], $response->status());

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Breed API connection failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Breed identification service is currently unavailable.',
            ], 503);

        } catch (\Exception $e) {
            Log::error('Breed identification failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong during breed identification.',
            ], 500);
        }
    }

    /**
     * Check if the breed identification service is available.
     */
    public function health()
    {
        $breedApiUrl = config('services.breed_api.url', 'http://localhost:5000');

        try {
            $response = Http::timeout(5)->get("{$breedApiUrl}/health");

            return response()->json([
                'available' => $response->successful(),
                'service' => 'breed_identifier',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'available' => false,
                'service' => 'breed_identifier',
            ]);
        }
    }
}
