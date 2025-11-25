# Shooter Feature - Backend API Requirements

This document outlines the backend API endpoints required to support the Shooter functionality in the PawLink application.

## Overview

The Shooter role allows verified users to handle pet breeding sessions. They can view assigned breeding pairs, track progress, and manage breeding activities.

## Required Database Tables/Models

### 1. shooter_profiles

- `id` (primary key)
- `user_id` (foreign key to users table)
- `experience_years` (integer)
- `specialization` (string) - e.g., "dogs", "cats", "all"
- `rating` (decimal)
- `total_breeding_handled` (integer)
- `is_verified` (boolean)
- `created_at`, `updated_at`

### 2. breeding_assignments

- `id` (primary key)
- `booking_id` (foreign key to bookings table)
- `shooter_id` (foreign key to shooter_profiles)
- `pet1_id` (foreign key to pets)
- `pet2_id` (foreign key to pets)
- `owner1_id` (foreign key to users)
- `owner2_id` (foreign key to users)
- `location` (string)
- `fee` (decimal)
- `status` (enum: 'pending', 'accepted', 'in_progress', 'completed', 'cancelled')
- `scheduled_date` (datetime)
- `notes` (text)
- `created_at`, `updated_at`

### 3. breeding_updates

- `id` (primary key)
- `assignment_id` (foreign key to breeding_assignments)
- `shooter_id` (foreign key to shooter_profiles)
- `update_text` (text)
- `photos` (json array)
- `created_at`

## Required API Endpoints

### 1. Get Shooter Breeding Pairs

**Endpoint:** `GET /api/shooter/breeding-pairs`

**Description:** Retrieve all breeding pairs assigned to the authenticated shooter

**Authorization:** Bearer Token (Shooter role required)

**Response:**

```json
{
  "breeding_pairs": [
    {
      "id": 1,
      "pet1": {
        "pet_id": 1,
        "name": "Max",
        "photo_url": "pets/max.jpg"
      },
      "pet2": {
        "pet_id": 2,
        "name": "Luna",
        "photo_url": "pets/luna.jpg"
      },
      "owner1_name": "John Doe",
      "owner2_name": "Jane Smith",
      "location": "Zamboanga City",
      "fee": 2000,
      "status": "active",
      "booking_id": 123,
      "scheduled_date": "2025-11-30T10:00:00Z"
    }
  ],
  "current_handling": 4,
  "total_completed": 15,
  "total_earnings": 45000
}
```

### 2. Get Breeding Pair Details

**Endpoint:** `GET /api/shooter/breeding-pairs/{id}`

**Description:** Get detailed information about a specific breeding pair

**Authorization:** Bearer Token (Shooter role required)

**Response:**

```json
{
  "id": 1,
  "pet1_details": {
    "pet_id": 1,
    "name": "Max",
    "breed": "Golden Retriever",
    "age": "3 years",
    "sex": "male",
    "photos": [
      {
        "photo_url": "pets/max.jpg",
        "is_primary": true
      }
    ]
  },
  "pet2_details": {
    "pet_id": 2,
    "name": "Luna",
    "breed": "Golden Retriever",
    "age": "2 years",
    "sex": "female",
    "photos": [
      {
        "photo_url": "pets/luna.jpg",
        "is_primary": true
      }
    ]
  },
  "owner1_details": {
    "user_id": 10,
    "name": "John Doe",
    "phone": "+63 912 345 6789",
    "email": "john@example.com"
  },
  "owner2_details": {
    "user_id": 11,
    "name": "Jane Smith",
    "phone": "+63 987 654 3210",
    "email": "jane@example.com"
  },
  "location": "Zamboanga City",
  "fee": 2000,
  "status": "in_progress",
  "scheduled_date": "2025-11-30T10:00:00Z",
  "notes": "Both pets are healthy and ready",
  "progress_updates": [
    {
      "id": 1,
      "update": "Initial meeting completed",
      "created_at": "2025-11-25T14:30:00Z"
    }
  ]
}
```

### 3. Update Breeding Status

**Endpoint:** `PUT /api/shooter/breeding-pairs/{id}/status`

**Description:** Update the status of a breeding pair

**Authorization:** Bearer Token (Shooter role required)

**Request Body:**

```json
{
  "status": "completed",
  "notes": "Breeding completed successfully"
}
```

**Response:**

```json
{
  "message": "Status updated successfully"
}
```

### 4. Add Breeding Update

**Endpoint:** `POST /api/shooter/breeding-pairs/{id}/updates`

**Description:** Add a progress update with optional photos

**Authorization:** Bearer Token (Shooter role required)

**Request Body:**

```json
{
  "update": "Pets are getting along well",
  "photos": ["updates/photo1.jpg", "updates/photo2.jpg"]
}
```

**Response:**

```json
{
  "message": "Update added successfully",
  "update_id": 5
}
```

### 5. Get Shooter Statistics

**Endpoint:** `GET /api/shooter/statistics`

**Description:** Get shooter's performance statistics

**Authorization:** Bearer Token (Shooter role required)

**Response:**

```json
{
  "total_breeding_handled": 25,
  "active_breeding": 4,
  "success_rate": 92,
  "total_earnings": 65000,
  "monthly_earnings": 12000,
  "rating": 4.8,
  "reviews_count": 18
}
```

### 6. Respond to Breeding Request

**Endpoint:** `POST /api/shooter/breeding-pairs/{id}/respond`

**Description:** Accept or reject a breeding assignment

**Authorization:** Bearer Token (Shooter role required)

**Request Body:**

```json
{
  "accept": true,
  "reason": "Schedule conflicts" // Optional, mainly for rejections
}
```

**Response:**

```json
{
  "message": "Response recorded successfully"
}
```

## User Role Management

### Update User Role

**Endpoint:** `PUT /api/user/role`

**Description:** Switch between Pet Owner and Shooter roles

**Authorization:** Bearer Token

**Request Body:**

```json
{
  "role": "shooter" // or "pet_owner"
}
```

**Response:**

```json
{
  "message": "Role updated successfully",
  "current_role": "shooter"
}
```

**Note:** User must be verified as a shooter to switch to shooter role.

## Business Logic Requirements

1. **Shooter Verification:**

   - Users must complete ID verification before becoming a shooter
   - Additional shooter-specific verification may be required (experience, references, etc.)

2. **Assignment Matching:**

   - System should match shooters based on location, availability, and experience
   - Shooters can accept or reject assignments

3. **Payment Processing:**

   - Track shooter fees separately from breeding fees
   - Implement commission/payment structure for shooters

4. **Rating System:**

   - Pet owners can rate shooters after breeding completion
   - Maintain average rating for each shooter

5. **Notifications:**
   - Notify shooters of new breeding assignments
   - Notify pet owners of progress updates
   - Send reminders for scheduled breeding sessions

## Frontend-Backend Integration Notes

- All endpoints use Bearer token authentication
- Images should be served from `/storage/` path
- Dates should be in ISO 8601 format
- Error responses should follow standard format:
  ```json
  {
    "error": "Error message",
    "code": "ERROR_CODE"
  }
  ```

## Migration Steps

1. Create `shooter_profiles` table
2. Create `breeding_assignments` table
3. Create `breeding_updates` table
4. Add shooter-related columns to `users` table if needed
5. Create API routes and controllers
6. Implement authentication middleware for shooter role
7. Test all endpoints thoroughly
