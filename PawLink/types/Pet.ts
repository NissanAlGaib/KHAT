/**
 * Pet-related TypeScript interfaces
 */

export interface PetImage {
  id: number;
  pet_id: number;
  url: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: number;
  user_id: number;
  name: string;
  species: string;
  breed: string;
  gender: "male" | "female";
  birthdate: string;
  color: string;
  weight?: number;
  weight_unit?: "kg" | "lbs";
  microchip_id?: string;
  registration_number?: string;
  description?: string;
  temperament?: string;
  health_status?: string;
  vaccination_status?: string;
  is_available_for_breeding: boolean;
  breeding_experience?: string;
  has_been_bred: boolean;
  breeding_price?: number;
  images: PetImage[];
  primary_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PetFormData {
  name: string;
  species: string;
  breed: string;
  gender: string;
  birthdate: string;
  color: string;
  weight?: number;
  weight_unit?: string;
  microchip_id?: string;
  registration_number?: string;
  description?: string;
  temperament?: string;
  health_status?: string;
  vaccination_status?: string;
  is_available_for_breeding?: boolean;
  breeding_experience?: string;
  has_been_bred?: boolean;
  breeding_price?: number;
  images?: ImagePickerAsset[];
  health_certificate?: DocumentPickerAsset;
}

export interface ImagePickerAsset {
  uri: string;
  type?: string;
  name?: string;
  width?: number;
  height?: number;
}

export interface DocumentPickerAsset {
  uri: string;
  type?: string;
  name?: string;
  size?: number;
}

export interface Litter {
  id: number;
  breeding_contract_id: number;
  birth_date: string;
  total_count: number;
  male_count: number;
  female_count: number;
  notes?: string;
  puppies: LitterPuppy[];
  created_at: string;
  updated_at: string;
}

export interface LitterPuppy {
  id: number;
  litter_id: number;
  name?: string;
  gender: "male" | "female";
  color?: string;
  weight?: number;
  allocated_to?: "dam_owner" | "sire_owner" | "shooter";
  status: "available" | "allocated" | "sold" | "kept";
  notes?: string;
  created_at: string;
  updated_at: string;
}
