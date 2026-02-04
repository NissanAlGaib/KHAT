import axiosInstance from "@/config/axiosConfig";

export interface PetFormData {
  // Step 1 - Basic Information
  name: string;
  species: string;
  breed: string;
  sex: string;
  birthdate: string;
  microchip?: string;
  height: string;
  weight: string;
  has_been_bred: boolean;
  breeding_count?: string;

  // Step 2 - About
  behaviors: string[];
  behavior_tags?: string;
  attributes: string[];
  attribute_tags?: string;
  description: string;

  // Step 3 - Rabies Vaccination
  rabies_vaccination_record: File;
  rabies_clinic_name: string;
  rabies_veterinarian_name: string;
  rabies_given_date: string;
  rabies_expiration_date: string;

  // Step 3 - DHPP Vaccination
  dhpp_vaccination_record: File;
  dhpp_clinic_name: string;
  dhpp_veterinarian_name: string;
  dhpp_given_date: string;
  dhpp_expiration_date: string;

  // Step 3 - Additional vaccinations (optional)
  additional_vaccinations?: Array<{
    vaccination_type: string;
    vaccination_record: File;
    clinic_name: string;
    veterinarian_name: string;
    given_date: string;
    expiration_date: string;
  }>;

  // Step 4 - Health Certificate
  health_certificate: File;
  health_clinic_name: string;
  health_veterinarian_name: string;
  health_given_date: string;
  health_expiration_date: string;

  // Step 5 - Pet Photos
  pet_photos: File[];

  // Step 6 - Partner Preferences (optional)
  preferred_breed?: string;
  partner_behaviors?: string[];
  partner_behavior_tags?: string;
  partner_attributes?: string[];
  partner_attribute_tags?: string;
  min_age?: string;
  max_age?: string;
}

export const createPet = async (petData: PetFormData) => {
  const formData = new FormData();

  // Step 1 - Basic Information
  formData.append("name", petData.name);
  formData.append("species", petData.species);
  formData.append("breed", petData.breed);
  formData.append("sex", petData.sex);
  formData.append("birthdate", petData.birthdate);
  if (petData.microchip) {
    formData.append("microchip", petData.microchip);
  }
  formData.append("height", petData.height);
  formData.append("weight", petData.weight);
  formData.append("has_been_bred", petData.has_been_bred ? "1" : "0");
  if (petData.breeding_count) {
    formData.append("breeding_count", petData.breeding_count);
  }

  // Step 2 - About
  petData.behaviors.forEach((behavior, index) => {
    formData.append(`behaviors[${index}]`, behavior);
  });
  if (petData.behavior_tags) {
    formData.append("behavior_tags", petData.behavior_tags);
  }
  petData.attributes.forEach((attribute, index) => {
    formData.append(`attributes[${index}]`, attribute);
  });
  if (petData.attribute_tags) {
    formData.append("attribute_tags", petData.attribute_tags);
  }
  formData.append("description", petData.description);

  // Step 3 - Rabies Vaccination
  formData.append(
    "rabies_vaccination_record",
    petData.rabies_vaccination_record
  );
  formData.append("rabies_clinic_name", petData.rabies_clinic_name);
  formData.append("rabies_veterinarian_name", petData.rabies_veterinarian_name);
  formData.append("rabies_given_date", petData.rabies_given_date);
  formData.append("rabies_expiration_date", petData.rabies_expiration_date);

  // Step 3 - DHPP Vaccination
  formData.append("dhpp_vaccination_record", petData.dhpp_vaccination_record);
  formData.append("dhpp_clinic_name", petData.dhpp_clinic_name);
  formData.append("dhpp_veterinarian_name", petData.dhpp_veterinarian_name);
  formData.append("dhpp_given_date", petData.dhpp_given_date);
  formData.append("dhpp_expiration_date", petData.dhpp_expiration_date);

  // Step 3 - Additional Vaccinations (optional)
  if (
    petData.additional_vaccinations &&
    petData.additional_vaccinations.length > 0
  ) {
    petData.additional_vaccinations.forEach((vaccination, index) => {
      formData.append(
        `additional_vaccinations[${index}][vaccination_type]`,
        vaccination.vaccination_type
      );
      formData.append(
        `additional_vaccinations[${index}][vaccination_record]`,
        vaccination.vaccination_record
      );
      formData.append(
        `additional_vaccinations[${index}][clinic_name]`,
        vaccination.clinic_name
      );
      formData.append(
        `additional_vaccinations[${index}][veterinarian_name]`,
        vaccination.veterinarian_name
      );
      formData.append(
        `additional_vaccinations[${index}][given_date]`,
        vaccination.given_date
      );
      formData.append(
        `additional_vaccinations[${index}][expiration_date]`,
        vaccination.expiration_date
      );
    });
  }

  // Step 4 - Health Certificate
  formData.append("health_certificate", petData.health_certificate);
  formData.append("health_clinic_name", petData.health_clinic_name);
  formData.append("health_veterinarian_name", petData.health_veterinarian_name);
  formData.append("health_given_date", petData.health_given_date);
  formData.append("health_expiration_date", petData.health_expiration_date);

  // Step 5 - Pet Photos
  petData.pet_photos.forEach((photo, index) => {
    formData.append(`pet_photos[${index}]`, photo);
  });

  // Step 6 - Partner Preferences (optional)
  if (petData.preferred_breed) {
    formData.append("preferred_breed", petData.preferred_breed);
  }
  if (petData.partner_behaviors && petData.partner_behaviors.length > 0) {
    petData.partner_behaviors.forEach((behavior, index) => {
      formData.append(`partner_behaviors[${index}]`, behavior);
    });
  }
  if (petData.partner_behavior_tags) {
    formData.append("partner_behavior_tags", petData.partner_behavior_tags);
  }
  if (petData.partner_attributes && petData.partner_attributes.length > 0) {
    petData.partner_attributes.forEach((attribute, index) => {
      formData.append(`partner_attributes[${index}]`, attribute);
    });
  }
  if (petData.partner_attribute_tags) {
    formData.append("partner_attribute_tags", petData.partner_attribute_tags);
  }
  if (petData.min_age) {
    formData.append("min_age", petData.min_age);
  }
  if (petData.max_age) {
    formData.append("max_age", petData.max_age);
  }

  try {
    const response = await axiosInstance.post("/api/pets", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    // Check if this is a verification required response (403)
    if (error.response?.status === 403 && error.response?.data?.requires_verification) {
      return {
        success: false,
        message: error.response.data.message,
        requires_verification: true,
      };
    }
    throw error;
  }
};

export const getPets = async () => {
  const response = await axiosInstance.get("/api/pets");
  return response.data.pets;
};

export const getPet = async (id: number) => {
  const response = await axiosInstance.get(`/api/pets/${id}`);
  return response.data.pet;
};

// New interfaces for pet profile and litters
export interface BreedingPartner {
  pet_id: number;
  name: string;
  breed: string;
  photo: string;
  litter_count: number;
}

export interface Vaccination {
  vaccine_name: string;
  expiration_date: string;
  status: "valid" | "expiring_soon" | "expired";
}

export interface HealthRecord {
  record_type: string;
  given_date: string;
  status: string;
}

export interface PetPhoto {
  photo_id: number;
  photo_url: string;
  is_primary: boolean;
}

export interface PetPublicProfile {
  pet_id: number;
  name: string;
  species: string;
  breed: string;
  sex: string;
  age: string;
  birthdate: string;
  microchip_id?: string;
  height: number;
  weight: number;
  behaviors: string[];
  attributes: string[];
  description: string;
  profile_image: string;
  has_been_bred: boolean;
  breeding_count: number;
  status: string;
  is_on_cooldown: boolean;
  cooldown_until?: string;
  cooldown_days_remaining?: number;
  is_available_for_matching: boolean;
  owner: {
    id: number;
    name: string;
    profile_image?: string;
  };
  photos: PetPhoto[];
  preferences: string[];
  vaccinations: Vaccination[];
  health_records: HealthRecord[];
  breeding_partners: BreedingPartner[];
  litter_count: number;
}

export interface LitterOffspring {
  offspring_id: number;
  name?: string;
  sex: string;
  color?: string;
  photo_url?: string;
  status: string;
}

export interface LitterParent {
  pet_id: number;
  name: string;
  photo: string;
  owner: {
    id: number;
    name: string;
    profile_image?: string;
  };
}

export interface Litter {
  litter_id: number;
  title: string;
  birth_date: string;
  birth_date_full: string;
  status: string;
  offspring: {
    total: number;
    alive: number;
    died: number;
    male: number;
    female: number;
  };
  parents: {
    sire: LitterParent;
    dam: LitterParent;
  };
  offspring_details: LitterOffspring[];
}

export interface LitterDetail {
  litter_id: number;
  title: string;
  birth_date: string;
  age_in_months: number;
  status: string;
  notes?: string;
  statistics: {
    total_offspring: number;
    alive_offspring: number;
    died_offspring: number;
    male_count: number;
    female_count: number;
  };
  parents: {
    sire: LitterParent & { breed: string };
    dam: LitterParent & { breed: string };
  };
  offspring: LitterOffspring[];
}

/**
 * Get public profile of a pet (for viewing other users' pets)
 */
export const getPetPublicProfile = async (
  petId: number
): Promise<PetPublicProfile> => {
  const response = await axiosInstance.get(`/api/pets/${petId}/profile`);
  return response.data.data;
};

/**
 * Get all litters for a specific pet
 */
export const getPetLitters = async (petId: number): Promise<Litter[]> => {
  const response = await axiosInstance.get(`/api/pets/${petId}/litters`);
  return response.data.data;
};

/**
 * Get detailed information about a specific litter
 */
export const getLitterDetail = async (
  litterId: number
): Promise<LitterDetail> => {
  const response = await axiosInstance.get(`/api/litters/${litterId}`);
  return response.data.data;
};

export interface CreateLitterData {
  sire_id: number;
  dam_id: number;
  birth_date: string;
  notes?: string;
  offspring: Array<{
    name?: string;
    sex: "male" | "female";
    color?: string;
    photo?: File;
    status: "alive" | "died" | "adopted";
    death_date?: string;
    notes?: string;
  }>;
}

/**
 * Create a new litter
 */
export const createLitter = async (litterData: CreateLitterData) => {
  const formData = new FormData();

  formData.append("sire_id", litterData.sire_id.toString());
  formData.append("dam_id", litterData.dam_id.toString());
  formData.append("birth_date", litterData.birth_date);

  if (litterData.notes) {
    formData.append("notes", litterData.notes);
  }

  litterData.offspring.forEach((offspring, index) => {
    if (offspring.name) {
      formData.append(`offspring[${index}][name]`, offspring.name);
    }
    formData.append(`offspring[${index}][sex]`, offspring.sex);
    if (offspring.color) {
      formData.append(`offspring[${index}][color]`, offspring.color);
    }
    if (offspring.photo) {
      formData.append(`offspring[${index}][photo]`, offspring.photo);
    }
    formData.append(`offspring[${index}][status]`, offspring.status);
    if (offspring.death_date) {
      formData.append(`offspring[${index}][death_date]`, offspring.death_date);
    }
    if (offspring.notes) {
      formData.append(`offspring[${index}][notes]`, offspring.notes);
    }
  });

  const response = await axiosInstance.post("/api/litters", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// ===========================================
// VACCINATION CARD SYSTEM (New Card-Based API)
// ===========================================

export interface VaccinationShot {
  shot_id: number;
  shot_number: number;
  vaccination_record: string;
  clinic_name: string;
  veterinarian_name: string;
  date_administered: string;
  date_administered_display: string;
  expiration_date: string;
  expiration_date_display: string;
  next_shot_date?: string;
  next_shot_date_display?: string;
  status: "completed" | "pending" | "overdue" | "verified";
  verification_status: "pending" | "approved" | "rejected";
  display_status: string;
  rejection_reason?: string;
  is_expired: boolean;
  is_expiring_soon: boolean;
}

export interface VaccinationCard {
  card_id: number;
  pet_id: number;
  vaccine_type: string;
  vaccine_name: string;
  is_required: boolean;
  total_shots_required: number | null;
  interval_days: number | null;
  recurrence_type: "none" | "yearly" | "biannual";
  status: "not_started" | "in_progress" | "completed" | "overdue";
  progress_percentage: number;
  completed_shots_count: number;
  is_series_complete: boolean;
  next_shot_date?: string;
  next_shot_date_display?: string;
  shots: VaccinationShot[];
}

export interface VaccinationCardsResponse {
  required: VaccinationCard[];
  optional: VaccinationCard[];
}

export interface VaccinationSummary {
  total_cards: number;
  completed_cards: number;
  in_progress_cards: number;
  overdue_cards: number;
  overall_status: string;
  cards: Array<{
    card_id: number;
    vaccine_name: string;
    is_required: boolean;
    status: string;
    progress: number;
    completed_shots: number;
    total_shots: number | null;
    next_shot_date?: string;
  }>;
}

/**
 * Get all vaccination cards for a pet
 */
export const getVaccinationCards = async (
  petId: number
): Promise<VaccinationCardsResponse> => {
  const response = await axiosInstance.get(
    `/api/pets/${petId}/vaccination-cards`
  );
  return response.data.data;
};

/**
 * Get a specific vaccination card with all shots
 */
export const getVaccinationCard = async (
  petId: number,
  cardId: number
): Promise<VaccinationCard> => {
  const response = await axiosInstance.get(
    `/api/pets/${petId}/vaccination-cards/${cardId}`
  );
  return response.data.data;
};

/**
 * Add a new shot to a vaccination card
 */
export const addVaccinationShot = async (
  petId: number,
  cardId: number,
  shotData: {
    vaccination_record: File;
    clinic_name: string;
    veterinarian_name: string;
    date_administered: string;
    expiration_date: string;
  }
): Promise<{ shot: VaccinationShot; card: VaccinationCard }> => {
  const formData = new FormData();
  formData.append("vaccination_record", shotData.vaccination_record);
  formData.append("clinic_name", shotData.clinic_name);
  formData.append("veterinarian_name", shotData.veterinarian_name);
  formData.append("date_administered", shotData.date_administered);
  formData.append("expiration_date", shotData.expiration_date);

  const response = await axiosInstance.post(
    `/api/pets/${petId}/vaccination-cards/${cardId}/shots`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
};

/**
 * Create a custom (optional) vaccination card
 */
export const createCustomVaccinationCard = async (
  petId: number,
  cardData: {
    vaccine_name: string;
    total_shots?: number;
    interval_days?: number;
    recurrence_type?: "none" | "yearly" | "biannual";
  }
): Promise<VaccinationCard> => {
  const response = await axiosInstance.post(
    `/api/pets/${petId}/vaccination-cards`,
    cardData
  );
  return response.data.data;
};

/**
 * Delete a custom vaccination card (only optional cards can be deleted)
 */
export const deleteVaccinationCard = async (
  petId: number,
  cardId: number
): Promise<void> => {
  await axiosInstance.delete(`/api/pets/${petId}/vaccination-cards/${cardId}`);
};

/**
 * Get vaccination summary for a pet
 */
export const getVaccinationSummary = async (
  petId: number
): Promise<VaccinationSummary> => {
  const response = await axiosInstance.get(
    `/api/pets/${petId}/vaccination-summary`
  );
  return response.data.data;
};

/**
 * Initialize required vaccination cards for a pet
 */
export const initializeVaccinationCards = async (
  petId: number
): Promise<VaccinationCard[]> => {
  const response = await axiosInstance.post(
    `/api/pets/${petId}/vaccination-cards/initialize`
  );
  return response.data.data;
};
