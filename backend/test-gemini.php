<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apiKey = config('services.gemini.api_key');
$url = 'https://generativelanguage.googleapis.com/v1beta';

echo "=== GEMINI API DIAGNOSTIC TOOL ===\n";
echo "API Key Set: " . (empty($apiKey) ? "NO ❌" : "YES ✅") . "\n";

if (empty($apiKey)) {
    exit("Please set GEMINI_API_KEY in .env\n");
}

// ---------------------------------------------------------
// TEST 1: List Models
// ---------------------------------------------------------
echo "\n[1] Checking Available Models...\n";
$response = Illuminate\Support\Facades\Http::get("$url/models?key=$apiKey");

if ($response->successful()) {
    echo "✅ Success! Found " . count($response->json()['models'] ?? []) . " models.\n";
    $models = collect($response->json()['models'])->pluck('name')->toArray();
    
    $hasImagen = false;
    foreach ($models as $m) {
        if (str_contains($m, 'imagen')) {
            echo "   Found Image Model: $m\n";
            $hasImagen = true;
        }
    }
    
    if (!$hasImagen) {
        echo "❌ WARNING: No 'imagen' models found in your list. Image generation might not be enabled for this key.\n";
    }
} else {
    echo "❌ Failed to list models: " . $response->status() . "\n";
    echo substr($response->body(), 0, 200) . "...\n";
}

// ---------------------------------------------------------
// TEST 2: OpenAI Compatible Image Generation (Current Code)
// ---------------------------------------------------------
echo "\n[2] Testing OpenAI-Compatible Image Endpoint...\n";
$targetModel = 'imagen-3.0-generate-001'; // Standard name
echo "Target Model: $targetModel\n";

$response = Illuminate\Support\Facades\Http::withHeaders([
    'Authorization' => "Bearer $apiKey",
    'Content-Type' => 'application/json',
])->post("$url/openai/images/generations", [
    'model' => $targetModel,
    'prompt' => 'a cute puppy',
    'response_format' => 'b64_json',
    'n' => 1,
    'size' => '1024x1024'
]);

if ($response->successful()) {
    echo "✅ SUCCESS! Image generated.\n";
} else {
    echo "❌ FAILED (" . $response->status() . ")\n";
    echo "Response: " . $response->body() . "\n";
}

// ---------------------------------------------------------
// TEST 3: Native Predict Endpoint (Alternative)
// ---------------------------------------------------------
echo "\n[3] Testing Native Predict Endpoint (Fallback)...\n";
// Try to guess a valid model from list or default
$nativeModel = 'models/imagen-3.0-generate-001';

$response = Illuminate\Support\Facades\Http::withHeaders([
    'Content-Type' => 'application/json',
])->post("$url/$nativeModel:predict?key=$apiKey", [
    'instances' => [
        ['prompt' => 'a cute puppy']
    ],
    'parameters' => [
        'sampleCount' => 1
    ]
]);

if ($response->successful()) {
    echo "✅ SUCCESS! Native endpoint works.\n";
} else {
    echo "❌ FAILED (" . $response->status() . ")\n";
    echo "Response: " . $response->body() . "\n";
}

echo "\n=== DIAGNOSIS COMPLETE ===\n";
