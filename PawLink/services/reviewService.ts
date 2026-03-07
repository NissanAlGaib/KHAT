/**
 * reviewService.ts
 * API service layer for the category-based review / rating system.
 */

import axiosInstance from "../config/axiosConfig";
import {
  ReviewSubmission,
  BreederReviewAsShooterSubmission,
  ReviewStatus,
  UserReview,
  UserReviewsData,
} from "../types/Review";

// ---------------------------------------------------------------------------
// Breeder ↔ Breeder review
// ---------------------------------------------------------------------------

/**
 * Submit a category-based breeder review after match completion.
 * POST /api/match-requests/{matchId}/review
 */
export const submitBreederReview = async (
  matchId: number,
  payload: ReviewSubmission,
): Promise<{ success: boolean; message: string; review: UserReview }> => {
  const response = await axiosInstance.post(
    `api/match-requests/${matchId}/review`,
    payload,
  );
  return response.data;
};

// ---------------------------------------------------------------------------
// Breeder → Shooter review
// ---------------------------------------------------------------------------

/**
 * Submit a review for the shooter assigned to a contract.
 * POST /api/contracts/{contractId}/review-shooter
 */
export const submitShooterReview = async (
  contractId: number,
  payload: ReviewSubmission,
): Promise<{ success: boolean; message: string; review: UserReview }> => {
  const response = await axiosInstance.post(
    `api/contracts/${contractId}/review-shooter`,
    payload,
  );
  return response.data;
};

// ---------------------------------------------------------------------------
// Shooter → Breeder review
// ---------------------------------------------------------------------------

/**
 * Shooter submits a review for one of the pet owners.
 * POST /api/contracts/{contractId}/review-breeder
 */
export const submitBreederReviewAsShooter = async (
  contractId: number,
  payload: BreederReviewAsShooterSubmission,
): Promise<{ success: boolean; message: string; review: UserReview }> => {
  const response = await axiosInstance.post(
    `api/contracts/${contractId}/review-breeder`,
    payload,
  );
  return response.data;
};

// ---------------------------------------------------------------------------
// Review status check
// ---------------------------------------------------------------------------

/**
 * Check whether the current user has already submitted reviews for a match.
 * GET /api/match-requests/{matchId}/review-status
 */
export const getReviewStatus = async (
  matchId: number,
): Promise<ReviewStatus> => {
  const response = await axiosInstance.get(
    `api/match-requests/${matchId}/review-status`,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Profile reviews
// ---------------------------------------------------------------------------

/**
 * Get paginated reviews + category breakdown for a user's profile.
 * GET /api/users/{userId}/reviews?type=breeder|shooter
 */
export const getUserReviews = async (
  userId: number,
  type: "breeder" | "shooter" = "breeder",
  page: number = 1,
): Promise<UserReviewsData> => {
  const response = await axiosInstance.get(`api/users/${userId}/reviews`, {
    params: { type, page },
  });
  return response.data.data;
};
