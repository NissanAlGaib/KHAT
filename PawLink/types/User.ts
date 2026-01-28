/**
 * User-related TypeScript interfaces
 */

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  bio?: string;
  role: UserRole;
  is_verified: boolean;
  verification_status?: VerificationStatusType;
  subscription_tier?: SubscriptionTier;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export type UserRole = "user" | "breeder" | "shooter" | "admin";

export type VerificationStatusType =
  | "unverified"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

export type SubscriptionTier = "free" | "basic" | "premium" | "professional";

export interface ShooterProfile extends User {
  shooter_rating?: number;
  completed_breedings?: number;
  experience_years?: number;
  specializations?: string[];
  availability_status?: "available" | "busy" | "unavailable";
}

export interface UserPreferences {
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  preferred_species?: string[];
  preferred_breeds?: string[];
  max_distance?: number;
  distance_unit?: "km" | "miles";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
