<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\PetFavorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    /**
     * List all favorited pets for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $favorites = PetFavorite::where('user_id', $request->user()->id)
            ->with(['pet' => function ($query) {
                $query->with(['owner:id,name,profile_image,address', 'photos']);
            }])
            ->latest()
            ->get()
            ->filter(fn($fav) => $fav->pet !== null)
            ->map(function ($fav) {
                $pet = $fav->pet;
                $primaryPhoto = $pet->photos->firstWhere('is_primary', true) ?? $pet->photos->first();
                $ownerAddress = $pet->owner->address ?? null;
                $locationText = null;
                if (is_array($ownerAddress)) {
                    $parts = array_filter([
                        $ownerAddress['city'] ?? $ownerAddress['municipality'] ?? null,
                        $ownerAddress['province'] ?? $ownerAddress['region'] ?? null,
                    ]);
                    $locationText = implode(', ', $parts) ?: null;
                }

                return [
                    'id' => $fav->id,
                    'pet_id' => $pet->pet_id,
                    'name' => $pet->name,
                    'species' => $pet->species,
                    'breed' => $pet->breed,
                    'sex' => $pet->sex,
                    'profile_image' => $primaryPhoto?->photo_url ?? $pet->profile_image,
                    'owner' => [
                        'id' => $pet->owner->id,
                        'name' => $pet->owner->name,
                        'profile_image' => $pet->owner->profile_image,
                        'location' => $locationText,
                    ],
                    'favorited_at' => $fav->created_at->toISOString(),
                ];
            })
            ->values();

        return response()->json(['data' => $favorites]);
    }

    /**
     * Add a pet to favorites (idempotent).
     */
    public function store(Request $request, int $petId): JsonResponse
    {
        $pet = Pet::where('pet_id', $petId)->firstOrFail();

        PetFavorite::firstOrCreate([
            'user_id' => $request->user()->id,
            'pet_id' => $pet->pet_id,
        ]);

        return response()->json([
            'message' => 'Pet added to favorites',
            'is_favorited' => true,
        ]);
    }

    /**
     * Remove a pet from favorites.
     */
    public function destroy(Request $request, int $petId): JsonResponse
    {
        PetFavorite::where('user_id', $request->user()->id)
            ->where('pet_id', $petId)
            ->delete();

        return response()->json([
            'message' => 'Pet removed from favorites',
            'is_favorited' => false,
        ]);
    }

    /**
     * Check if a pet is favorited by the authenticated user.
     */
    public function check(Request $request, int $petId): JsonResponse
    {
        $isFavorited = PetFavorite::where('user_id', $request->user()->id)
            ->where('pet_id', $petId)
            ->exists();

        return response()->json(['is_favorited' => $isFavorited]);
    }
}
