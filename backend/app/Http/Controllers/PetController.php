<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\UserAuth;
use App\Models\Vaccination;
use App\Models\HealthRecord;
use App\Models\PetPhoto;
use App\Models\PartnerPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PetController extends Controller
{
    /**
     * Check if a user has verified their identity (approved ID verification)
     */
    private function isUserVerified($userId): bool
    {
        return UserAuth::where('user_id', $userId)
            ->where('auth_type', 'id')
            ->where('status', 'approved')
            ->exists();
    }

    /**
     * Add cooldown information to a pet array
     * @param Pet $pet The pet model instance
     * @param array $petArray The pet array to augment with cooldown info
     * @return array The augmented pet array with cooldown information
     */
    private function addCooldownInfo(Pet $pet, array $petArray): array
    {
        $petArray['is_on_cooldown'] = $pet->isOnCooldown();
        $petArray['cooldown_until'] = $pet->cooldown_until?->format('Y-m-d');
        $petArray['cooldown_days_remaining'] = $pet->cooldown_days_remaining;
        return $petArray;
    }

    /**
     * Store a newly created pet in storage.
     */
    public function store(Request $request)
    {
        // Check if user is verified before allowing pet registration
        $user = Auth::user();
        if (!$this->isUserVerified($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You must complete identity verification before adding a pet',
                'requires_verification' => true,
            ], 403);
        }
        // Validate all pet data
        $validated = $request->validate([
            // Step 1 - Basic Information
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed' => 'required|string|max:255',
            'sex' => ['required', Rule::in(['male', 'female'])],
            'birthdate' => 'required|date|before:today',
            'microchip' => 'nullable|string|max:255|unique:pets,microchip_id',
            'height' => 'required|numeric|min:0|max:999.99',
            'weight' => 'required|numeric|min:0|max:999.99',
            'has_been_bred' => 'boolean',
            'breeding_count' => 'required_if:has_been_bred,true|nullable|integer|min:0',

            // Step 2 - About
            'behaviors' => 'required|array|min:1',
            'behaviors.*' => 'string',
            'behavior_tags' => 'nullable|string',
            'attributes' => 'required|array|min:1',
            'attributes.*' => 'string',
            'description' => 'required|string|max:200',

            // Step 3 - Vaccinations (Rabies) - Optional, added via card system after registration
            'rabies_vaccination_record' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'rabies_clinic_name' => 'required_with:rabies_vaccination_record|nullable|string|max:255',
            'rabies_veterinarian_name' => 'required_with:rabies_vaccination_record|nullable|string|max:255',
            'rabies_given_date' => 'required_with:rabies_vaccination_record|nullable|date|before_or_equal:today',
            'rabies_expiration_date' => 'required_with:rabies_vaccination_record|nullable|date|after:rabies_given_date',

            // Step 3 - Vaccinations (DHPP) - Optional, added via card system after registration
            'dhpp_vaccination_record' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'dhpp_clinic_name' => 'required_with:dhpp_vaccination_record|nullable|string|max:255',
            'dhpp_veterinarian_name' => 'required_with:dhpp_vaccination_record|nullable|string|max:255',
            'dhpp_given_date' => 'required_with:dhpp_vaccination_record|nullable|date|before_or_equal:today',
            'dhpp_expiration_date' => 'required_with:dhpp_vaccination_record|nullable|date|after:dhpp_given_date',

            // Step 3 - Additional Vaccinations (optional)
            'additional_vaccinations' => 'nullable|array',
            'additional_vaccinations.*.vaccination_type' => 'required|string|max:255',
            'additional_vaccinations.*.vaccination_record' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'additional_vaccinations.*.clinic_name' => 'required|string|max:255',
            'additional_vaccinations.*.veterinarian_name' => 'required|string|max:255',
            'additional_vaccinations.*.given_date' => 'required|date|before_or_equal:today',
            'additional_vaccinations.*.expiration_date' => 'required|date|after:additional_vaccinations.*.given_date',

            // Step 4 - Health Certificate
            'health_certificate' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
            'health_clinic_name' => 'required|string|max:255',
            'health_veterinarian_name' => 'required|string|max:255',
            'health_given_date' => 'required|date|before_or_equal:today',
            'health_expiration_date' => 'required|date|after:health_given_date',

            // Step 5 - Pet Photos
            'pet_photos' => 'required|array|min:3',
            'pet_photos.*' => 'required|image|mimes:jpg,jpeg,png|max:20480',

            // Step 6 - Partner Preferences (optional)
            'preferred_breed' => 'nullable|string|max:255',
            'partner_behaviors' => 'nullable|array',
            'partner_behaviors.*' => 'string',
            'partner_behavior_tags' => 'nullable|string',
            'partner_attributes' => 'nullable|array',
            'partner_attributes.*' => 'string',
            'partner_attribute_tags' => 'nullable|string',
            'min_age' => 'nullable|integer|min:0',
            'max_age' => 'nullable|integer|min:0|gte:min_age',
        ], [
            // Custom error messages
            'name.required' => 'Pet name is required.',
            'species.required' => 'Please select a species.',
            'breed.required' => 'Breed is required.',
            'sex.required' => 'Please select a sex.',
            'sex.in' => 'Sex must be either male or female.',
            'birthdate.required' => 'Birthdate is required.',
            'birthdate.before' => 'Birthdate must be in the past.',
            'height.required' => 'Height is required.',
            'height.numeric' => 'Height must be a number.',
            'weight.required' => 'Weight is required.',
            'weight.numeric' => 'Weight must be a number.',
            'breeding_count.required_if' => 'Breeding count is required when pet has been bred.',

            'behaviors.required' => 'Please select at least one behavior.',
            'behaviors.min' => 'Please select at least one behavior.',
            'attributes.required' => 'Please select at least one attribute.',
            'attributes.min' => 'Please select at least one attribute.',
            'description.required' => 'Description is required.',
            'description.max' => 'Description cannot exceed 200 characters.',

            'rabies_vaccination_record.mimes' => 'Rabies vaccination record must be an image or PDF.',
            'rabies_clinic_name.required_with' => 'Clinic name is required when providing Rabies vaccination.',
            'rabies_veterinarian_name.required_with' => 'Veterinarian name is required when providing Rabies vaccination.',
            'rabies_given_date.required_with' => 'Given date is required when providing Rabies vaccination.',
            'rabies_expiration_date.required_with' => 'Expiration date is required when providing Rabies vaccination.',
            'rabies_expiration_date.after' => 'Rabies expiration date must be after given date.',

            'dhpp_vaccination_record.mimes' => 'DHPP vaccination record must be an image or PDF.',
            'dhpp_clinic_name.required_with' => 'Clinic name is required when providing DHPP vaccination.',
            'dhpp_veterinarian_name.required_with' => 'Veterinarian name is required when providing DHPP vaccination.',
            'dhpp_given_date.required_with' => 'Given date is required when providing DHPP vaccination.',
            'dhpp_expiration_date.required_with' => 'Expiration date is required when providing DHPP vaccination.',
            'dhpp_expiration_date.after' => 'DHPP expiration date must be after given date.',

            'health_certificate.required' => 'Health certificate is required.',
            'health_clinic_name.required' => 'Clinic name is required for health certificate.',
            'health_veterinarian_name.required' => 'Veterinarian name is required for health certificate.',
            'health_given_date.required' => 'Given date is required for health certificate.',
            'health_expiration_date.required' => 'Expiration date is required for health certificate.',
            'health_expiration_date.after' => 'Health certificate expiration date must be after given date.',

            'pet_photos.required' => 'At least 3 pet photos are required.',
            'pet_photos.min' => 'At least 3 pet photos are required.',

            'max_age.gte' => 'Maximum age must be greater than or equal to minimum age.',
        ]);

        try {
            DB::beginTransaction();

            // Combine behaviors from selected tags and custom tags
            $allBehaviors = $validated['behaviors'];
            if (!empty($validated['behavior_tags'])) {
                $customBehaviors = array_map('trim', explode(',', $validated['behavior_tags']));
                $allBehaviors = array_merge($allBehaviors, $customBehaviors);
            }

            // Combine attributes from selected tags and custom tags
            $allAttributes = $validated['attributes'];
            if (!empty($validated['attribute_tags'])) {
                $customAttributes = array_map('trim', explode(',', $validated['attribute_tags']));
                $allAttributes = array_merge($allAttributes, $customAttributes);
            }

            // Store health certificate
            $healthCertPath = $request->file('health_certificate')->store('health_certificates', 'public');

            // Create the pet
            $pet = Pet::create([
                'user_id' => Auth::id(),
                'name' => $validated['name'],
                'species' => $validated['species'],
                'breed' => $validated['breed'],
                'sex' => $validated['sex'],
                'birthdate' => $validated['birthdate'],
                'microchip_id' => $validated['microchip'] ?? null,
                'height' => $validated['height'],
                'weight' => $validated['weight'],
                'description' => $validated['description'],
                'has_been_bred' => $validated['has_been_bred'] ?? false,
                'breeding_count' => $validated['breeding_count'] ?? 0,
                'behaviors' => $allBehaviors,
                'attributes' => $allAttributes,
                'status' => 'pending_verification',
            ]);

            // Create health record
            HealthRecord::create([
                'pet_id' => $pet->pet_id,
                'record_type' => 'Health Certificate',
                'health_certificate' => $healthCertPath,
                'clinic_name' => $validated['health_clinic_name'],
                'veterinarian_name' => $validated['health_veterinarian_name'],
                'given_date' => $validated['health_given_date'],
                'expiration_date' => $validated['health_expiration_date'],
                'status' => 'pending',
            ]);

            // Store Rabies vaccination (if provided)
            if ($request->hasFile('rabies_vaccination_record')) {
                $rabiesVaccinationPath = $request->file('rabies_vaccination_record')->store('vaccinations', 'public');
                Vaccination::create([
                    'pet_id' => $pet->pet_id,
                    'vaccine_name' => 'Rabies',
                    'vaccination_record' => $rabiesVaccinationPath,
                    'clinic_name' => $validated['rabies_clinic_name'],
                    'veterinarian_name' => $validated['rabies_veterinarian_name'],
                    'given_date' => $validated['rabies_given_date'],
                    'expiration_date' => $validated['rabies_expiration_date'],
                    'status' => 'pending',
                ]);
            }

            // Store DHPP vaccination (if provided)
            if ($request->hasFile('dhpp_vaccination_record')) {
                $dhppVaccinationPath = $request->file('dhpp_vaccination_record')->store('vaccinations', 'public');
                Vaccination::create([
                    'pet_id' => $pet->pet_id,
                    'vaccine_name' => 'DHPP',
                    'vaccination_record' => $dhppVaccinationPath,
                    'clinic_name' => $validated['dhpp_clinic_name'],
                    'veterinarian_name' => $validated['dhpp_veterinarian_name'],
                    'given_date' => $validated['dhpp_given_date'],
                    'expiration_date' => $validated['dhpp_expiration_date'],
                    'status' => 'pending',
                ]);
            }

            // Store additional vaccinations
            if (!empty($validated['additional_vaccinations'])) {
                foreach ($validated['additional_vaccinations'] as $vaccination) {
                    $vaccinationPath = $vaccination['vaccination_record']->store('vaccinations', 'public');
                    Vaccination::create([
                        'pet_id' => $pet->pet_id,
                        'vaccine_name' => $vaccination['vaccination_type'],
                        'vaccination_record' => $vaccinationPath,
                        'clinic_name' => $vaccination['clinic_name'],
                        'veterinarian_name' => $vaccination['veterinarian_name'],
                        'given_date' => $vaccination['given_date'],
                        'expiration_date' => $vaccination['expiration_date'],
                        'status' => 'pending',
                    ]);
                }
            }

            // Store pet photos
            $firstPhoto = true;
            foreach ($request->file('pet_photos') as $photo) {
                $photoPath = $photo->store('pet_photos', 'public');

                PetPhoto::create([
                    'pet_id' => $pet->pet_id,
                    'photo_url' => $photoPath,
                    'is_primary' => $firstPhoto,
                ]);

                // Set first photo as profile image
                if ($firstPhoto) {
                    $pet->update(['profile_image' => $photoPath]);
                    $firstPhoto = false;
                }
            }

            // Store partner preferences if provided
            if (
                !empty($validated['preferred_breed']) ||
                !empty($validated['partner_behaviors']) ||
                !empty($validated['partner_attributes']) ||
                !empty($validated['min_age']) ||
                !empty($validated['max_age'])
            ) {

                // Combine partner behaviors
                $partnerBehaviors = $validated['partner_behaviors'] ?? [];
                if (!empty($validated['partner_behavior_tags'])) {
                    $customBehaviors = array_map('trim', explode(',', $validated['partner_behavior_tags']));
                    $partnerBehaviors = array_merge($partnerBehaviors, $customBehaviors);
                }

                // Combine partner attributes
                $partnerAttributes = $validated['partner_attributes'] ?? [];
                if (!empty($validated['partner_attribute_tags'])) {
                    $customAttributes = array_map('trim', explode(',', $validated['partner_attribute_tags']));
                    $partnerAttributes = array_merge($partnerAttributes, $customAttributes);
                }

                PartnerPreference::create([
                    'pet_id' => $pet->pet_id,
                    'preferred_breed' => $validated['preferred_breed'] ?? null,
                    'preferred_behaviors' => !empty($partnerBehaviors) ? $partnerBehaviors : null,
                    'preferred_attributes' => !empty($partnerAttributes) ? $partnerAttributes : null,
                    'min_age' => $validated['min_age'] ?? null,
                    'max_age' => $validated['max_age'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Pet registered successfully',
                'pet' => $pet->load(['photos', 'vaccinations', 'healthRecords', 'partnerPreferences']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to register pet',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified pet.
     */
    public function show($id)
    {
        $pet = Pet::with(['photos', 'vaccinations', 'healthRecords', 'partnerPreferences', 'owner'])
            ->findOrFail($id);

        // Add cooldown information to the response
        $petArray = $this->addCooldownInfo($pet, $pet->toArray());

        return response()->json(['pet' => $petArray]);
    }

    /**
     * Get public profile of a pet (for viewing other users' pets)
     */
    public function getPublicProfile($id)
    {
        $pet = Pet::with([
            'owner:id,name,email,profile_image',
            'photos',
            'vaccinations' => function ($query) {
                $query->select('vaccination_id', 'pet_id', 'vaccine_name', 'expiration_date', 'status')
                    ->orderBy('expiration_date', 'desc');
            },
            'healthRecords' => function ($query) {
                $query->select('health_record_id', 'pet_id', 'record_type', 'given_date', 'status')
                    ->orderBy('given_date', 'desc');
            },
            'partnerPreferences'
        ])->findOrFail($id);

        // Get litters for this pet
        $litters = \App\Models\Litter::where(function ($query) use ($pet) {
            if ($pet->sex === 'male') {
                $query->where('sire_id', $pet->pet_id);
            } else {
                $query->where('dam_id', $pet->pet_id);
            }
        })
            ->with([
                'sire:pet_id,name,profile_image',
                'dam:pet_id,name,profile_image',
                'sireOwner:id,name',
                'damOwner:id,name',
                'offspring'
            ])
            ->orderBy('birth_date', 'desc')
            ->get();

        // Calculate common breeding partners
        $breedingPartners = [];
        if ($litters->isNotEmpty()) {
            $partnerCounts = [];
            foreach ($litters as $litter) {
                $partnerId = $pet->sex === 'male' ? $litter->dam_id : $litter->sire_id;
                $partnerName = $pet->sex === 'male' ? $litter->dam->name : $litter->sire->name;
                $partnerBreed = $pet->sex === 'male' ? $litter->dam->breed : $litter->sire->breed;
                $partnerPhoto = $pet->sex === 'male' ? $litter->dam->profile_image : $litter->sire->profile_image;

                if (!isset($partnerCounts[$partnerId])) {
                    $partnerCounts[$partnerId] = [
                        'pet_id' => $partnerId,
                        'name' => $partnerName,
                        'breed' => $partnerBreed,
                        'photo' => $partnerPhoto,
                        'litter_count' => 0,
                    ];
                }
                $partnerCounts[$partnerId]['litter_count']++;
            }

            $breedingPartners = array_values($partnerCounts);
            // Sort by litter count descending
            usort($breedingPartners, function ($a, $b) {
                return $b['litter_count'] - $a['litter_count'];
            });
        }

        // Format vaccinations
        $currentVaccinations = $pet->vaccinations->map(function ($vaccination) {
            $expirationDate = $vaccination->expiration_date;
            $now = now();
            $daysUntilExpiration = $now->diffInDays($expirationDate, false);

            $status = 'valid';
            if ($daysUntilExpiration < 0) {
                $status = 'expired';
            } elseif ($daysUntilExpiration <= 30) {
                $status = 'expiring_soon';
            }

            return [
                'vaccine_name' => $vaccination->vaccine_name,
                'expiration_date' => $expirationDate->format('n/j/Y'),
                'status' => $status,
            ];
        })->values();

        // Format health records
        $recentHealthRecords = $pet->healthRecords
            ->sortByDesc('given_date')
            ->take(5)
            ->map(function ($record) {
                return [
                    'record_type' => $record->record_type,
                    'given_date' => $record->given_date->format('n/j/Y'),
                    'status' => $record->status,
                ];
            })
            ->values();

        // Format partner preferences
        $preferences = [];
        if ($pet->partnerPreferences->isNotEmpty()) {
            $preference = $pet->partnerPreferences->first();
            if ($preference->preferred_breed || $preference->min_age || $preference->max_age) {
                $preferences[] = $preference->preferred_breed ?? 'Any breed';
            }
            if ($preference->preferred_behaviors) {
                $preferences = array_merge($preferences, $preference->preferred_behaviors);
            }
        }

        $formattedPet = [
            'pet_id' => $pet->pet_id,
            'name' => $pet->name,
            'species' => $pet->species,
            'breed' => $pet->breed,
            'sex' => $pet->sex,
            'age' => $pet->age,
            'birthdate' => $pet->birthdate->format('Y-m-d'),
            'microchip_id' => $pet->microchip_id,
            'height' => $pet->height,
            'weight' => $pet->weight,
            'behaviors' => $pet->behaviors,
            'attributes' => $pet->getAttribute('attributes'),
            'description' => $pet->description,
            'profile_image' => $pet->profile_image,
            'has_been_bred' => $pet->has_been_bred,
            'breeding_count' => $pet->breeding_count,
            'status' => $pet->status,
            'is_on_cooldown' => $pet->isOnCooldown(),
            'cooldown_until' => $pet->cooldown_until?->format('Y-m-d'),
            'cooldown_days_remaining' => $pet->cooldown_days_remaining,
            'is_available_for_matching' => $pet->isAvailableForMatching(),
            'owner' => [
                'id' => $pet->owner->id,
                'name' => $pet->owner->name,
                'profile_image' => $pet->owner->profile_image,
            ],
            'photos' => $pet->photos->map(function ($photo) {
                return [
                    'photo_id' => $photo->photo_id,
                    'photo_url' => $photo->photo_url,
                    'is_primary' => $photo->is_primary,
                ];
            }),
            'preferences' => $preferences,
            'vaccinations' => $currentVaccinations,
            'health_records' => $recentHealthRecords,
            'breeding_partners' => $breedingPartners,
            'litter_count' => $litters->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $formattedPet,
        ]);
    }

    /**
     * Display pets for the authenticated user.
     */
    public function index()
    {
        $pets = Pet::where('user_id', Auth::id())
            ->with(['photos', 'vaccinations', 'healthRecords'])
            ->get();

        // Add cooldown information to each pet
        $petsWithCooldown = $pets->map(function ($pet) {
            return $this->addCooldownInfo($pet, $pet->toArray());
        });

        return response()->json(['pets' => $petsWithCooldown]);
    }

    /**
     * Get all available pets (not owned by current user)
     * Excludes pets on cooldown after successful breeding
     */
    public function getAvailablePets(Request $request)
    {
        $user = $request->user();

        $pets = Pet::where('user_id', '!=', $user->id)
            ->availableForMatching() // Uses scope to exclude pets on cooldown
            ->with(['owner:id,name,profile_image', 'photos'])
            ->get();

        $formattedPets = $pets->map(function ($pet) {
            return [
                'pet_id' => $pet->pet_id,
                'name' => $pet->name,
                'species' => $pet->species,
                'breed' => $pet->breed,
                'sex' => $pet->sex,
                'birthdate' => $pet->birthdate,
                'age' => $pet->age,
                'behaviors' => $pet->behaviors,
                'attributes' => $pet->getAttribute('attributes'),
                'profile_image' => $pet->profile_image,
                'photos' => $pet->photos->map(function ($photo) {
                    return [
                        'photo_url' => $photo->photo_url,
                        'is_primary' => $photo->is_primary,
                    ];
                }),
                'owner' => [
                    'id' => $pet->owner->id,
                    'name' => $pet->owner->name,
                    'profile_image' => $pet->owner->profile_image,
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedPets
        ]);
    }

    /**
     * Resubmit a vaccination record
     */
    public function resubmitVaccination(Request $request, $petId, $vaccinationId)
    {
        try {
            $pet = Pet::where('user_id', Auth::id())
                ->where('pet_id', $petId)
                ->firstOrFail();

            $vaccination = Vaccination::where('pet_id', $petId)
                ->where('vaccination_id', $vaccinationId)
                ->firstOrFail();

            $request->validate([
                'document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
                'clinic_name' => 'required|string|max:255',
                'veterinarian_name' => 'required|string|max:255',
                'given_date' => 'required|date|before_or_equal:today',
                'expiration_date' => 'required|date|after:given_date',
            ]);

            // Store the new document
            $documentPath = $request->file('document')->store('vaccinations', 'public');

            // Update the vaccination record
            $vaccination->update([
                'vaccination_record' => $documentPath,
                'clinic_name' => $request->input('clinic_name'),
                'veterinarian_name' => $request->input('veterinarian_name'),
                'given_date' => $request->input('given_date'),
                'expiration_date' => $request->input('expiration_date'),
                'status' => 'pending',
                'rejection_reason' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Vaccination record resubmitted successfully',
                'data' => $vaccination,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubmit vaccination record',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resubmit a health record
     */
    public function resubmitHealthRecord(Request $request, $petId, $healthRecordId)
    {
        try {
            $pet = Pet::where('user_id', Auth::id())
                ->where('pet_id', $petId)
                ->firstOrFail();

            $healthRecord = HealthRecord::where('pet_id', $petId)
                ->where('health_record_id', $healthRecordId)
                ->firstOrFail();

            $request->validate([
                'document' => 'required|file|mimes:jpg,jpeg,png,pdf|max:20480',
                'clinic_name' => 'required|string|max:255',
                'veterinarian_name' => 'required|string|max:255',
                'given_date' => 'required|date|before_or_equal:today',
                'expiration_date' => 'required|date|after:given_date',
            ]);

            // Store the new document
            $documentPath = $request->file('document')->store('health_certificates', 'public');

            // Update the health record
            $healthRecord->update([
                'health_certificate' => $documentPath,
                'clinic_name' => $request->input('clinic_name'),
                'veterinarian_name' => $request->input('veterinarian_name'),
                'given_date' => $request->input('given_date'),
                'expiration_date' => $request->input('expiration_date'),
                'status' => 'pending',
                'rejection_reason' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Health record resubmitted successfully',
                'data' => $healthRecord,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resubmit health record',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
