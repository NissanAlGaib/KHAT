/**
 * Review / Rating TypeScript interfaces
 */

// ---------------------------------------------------------------------------
// Category definitions (must stay in sync with backend config/ratings.php)
// ---------------------------------------------------------------------------

export const BREEDER_CATEGORIES = {
  communication: "Communication & Responsiveness",
  pet_handling: "Pet Handling & Care",
  reliability: "Reliability & Punctuality",
  contract_compliance: "Contract Compliance",
  overall_experience: "Overall Experience",
} as const;

export const SHOOTER_CATEGORIES = {
  professionalism: "Professionalism",
  pet_handling_skills: "Pet Handling Skills",
  communication: "Communication",
  timeliness: "Timeliness",
  overall_satisfaction: "Overall Satisfaction",
} as const;

export type BreederCategory = keyof typeof BREEDER_CATEGORIES;
export type ShooterCategory = keyof typeof SHOOTER_CATEGORIES;
export type ReviewCategory = BreederCategory | ShooterCategory;

export type ReviewType = "breeder" | "shooter";

// ---------------------------------------------------------------------------
// Data models
// ---------------------------------------------------------------------------

export interface ReviewRating {
  id: number;
  user_review_id: number;
  category: string;
  rating: number; // 0.5 – 5.0 in 0.5 steps
  created_at: string;
  updated_at: string;
}

export interface UserReview {
  id: number;
  reviewer_id: number;
  subject_id: number;
  match_id: number | null;
  contract_id: number | null;
  review_type: ReviewType;
  average_rating: number | null;
  comment: string | null;
  ratings: ReviewRating[];
  reviewer?: {
    id: number;
    name: string;
    profile_image: string | null;
  };
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API payload / response shapes
// ---------------------------------------------------------------------------

/** What the frontend POSTs when submitting a review */
export interface ReviewSubmission {
  ratings: Partial<Record<string, number>>;
  comment?: string;
}

/** Shooter-review-from-breeder or breeder-review-from-shooter */
export interface ShooterReviewSubmission extends ReviewSubmission {}

export interface BreederReviewAsShooterSubmission extends ReviewSubmission {
  subject_id: number;
}

/** GET /api/match-requests/{match}/review-status */
export interface ReviewStatus {
  breeder_reviewed: boolean;
  breeder_review: UserReview | null;
  has_shooter: boolean;
  shooter_user_id: number | null;
  shooter_reviewed: boolean;
  is_shooter: boolean;
  breeder_reviews_by_shooter: Record<number, boolean>;
  contract_id: number | null;
}

/** Category average for profile display */
export interface CategoryAverage {
  label: string;
  average: number | null;
  count: number;
}

/** GET /api/users/{user}/reviews response data */
export interface UserReviewsData {
  overall_average: number;
  review_count: number;
  category_averages: Record<string, CategoryAverage>;
  categories: Record<string, string>;
  reviews: {
    data: UserReview[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
