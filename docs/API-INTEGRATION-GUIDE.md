# REKI API Integration Guide

## Table of Contents
- [Overview](#overview)
- [Base URL & API Documentation](#base-url--api-documentation)
- [Authentication](#authentication)
- [Core Endpoints](#core-endpoints)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The REKI API provides a comprehensive backend for the venue discovery and offers platform. This guide helps iOS developers integrate with the API efficiently.

**Technology Stack:**
- Framework: NestJS v11
- Database: PostgreSQL
- Authentication: JWT (Access + Refresh Token)
- Documentation: OpenAPI/Swagger

---

## Base URL & API Documentation

**Development Server:**
```
http://localhost:3000
```

**Interactive API Documentation:**
```
http://localhost:3000/api
```
Visit this URL in your browser for full Swagger documentation with try-it-out functionality.

---

## Authentication

### JWT Token System

REKI uses a dual-token authentication system:
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### 1. Register New User

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "isActive": true,
    "createdAt": "2026-02-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Using Access Token

Include the access token in the Authorization header for all protected endpoints:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**iOS Example (Swift):**
```swift
var request = URLRequest(url: url)
request.httpMethod = "GET"
request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
```

---

## Core Endpoints

### 1. Venue Discovery

#### Get All Venues
**Endpoint:** `GET /venues?cityId={cityId}`

**Manchester City ID:** `3ff5e526-7819-45d5-9995-bd6db919c9b2`

**Query Parameters:**
- `cityId` (required): City UUID
- `search`: Search by name/description
- `categories`: Filter by category (BAR, CLUB, RESTAURANT)
- `minBusyness`: Minimum busyness (QUIET, MODERATE, BUSY)
- `preferredVibes`: Filter by vibes (PARTY, CHILL, LIVE_MUSIC, SPORTS)
- `hasOffers`: Boolean - venues with active offers
- `sortBy`: Sort by (distance, name, busyness, offers)
- `lat`, `lng`, `radius`: Proximity search

**Example Request:**
```
GET /venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2&categories=BAR&hasOffers=true&sortBy=distance
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Albert's Schloss",
    "category": "BAR",
    "address": "27 Peter Street",
    "postcode": "M2 5QR",
    "lat": 53.4778,
    "lng": -2.2465,
    "coverImageUrl": "https://example.com/image.jpg",
    "description": "Bavarian-themed bar",
    "isActive": true,
    "busyness": "MODERATE",
    "vibe": "PARTY",
    "busynessUpdatedAt": "2026-02-15T10:00:00.000Z",
    "vibeUpdatedAt": "2026-02-15T10:00:00.000Z",
    "activeOffersCount": 3,
    "distance": 0.5,
    "createdAt": "2026-02-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
]
```

#### Get Single Venue
**Endpoint:** `GET /venues/:id`

**Response:** Same as venue object above with full details

---

### 2. Offers

#### Get Offers by Venue
**Endpoint:** `GET /offers/by-venue/:venueId`

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Happy Hour - 2 for 1",
    "description": "All cocktails 2 for 1",
    "offerType": "DISCOUNT",
    "minBusyness": "QUIET",
    "startsAt": "2026-02-15T17:00:00.000Z",
    "endsAt": "2026-02-15T19:00:00.000Z",
    "isActive": true,
    "viewCount": 45,
    "clickCount": 12,
    "redeemCount": 3,
    "venue": {
      "id": "uuid",
      "name": "Albert's Schloss",
      "category": "BAR",
      "address": "27 Peter Street"
    },
    "createdAt": "2026-02-15T10:00:00.000Z",
    "updatedAt": "2026-02-15T10:00:00.000Z"
  }
]
```

#### Track Offer View
**Endpoint:** `PATCH /offers/:id/view`

Increments view count. No authentication required.

#### Track Offer Click
**Endpoint:** `PATCH /offers/:id/click`

Increments click count. No authentication required.

#### Redeem Offer
**Endpoint:** `POST /offers/redeem` (Authenticated)

**Request:**
```json
{
  "offerId": "uuid",
  "venueId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Offer redeemed successfully"
}
```

---

### 3. User Notifications

#### Get User Notifications
**Endpoint:** `GET /notifications` (Authenticated)

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "type": "OFFER_AVAILABLE",
    "title": "New Offer at Albert's Schloss",
    "message": "Happy Hour - 2 for 1 drinks!",
    "data": {
      "offerId": "uuid",
      "venueId": "uuid"
    },
    "isRead": false,
    "createdAt": "2026-02-15T10:00:00.000Z"
  }
]
```

#### Get Unread Count
**Endpoint:** `GET /notifications/unread-count` (Authenticated)

**Response:**
```json
{
  "count": 5
}
```

#### Mark as Read
**Endpoint:** `PATCH /notifications/:id/read` (Authenticated)

#### Mark All as Read
**Endpoint:** `PATCH /notifications/mark-all-read` (Authenticated)

---

### 4. User Preferences

User preferences are automatically created on registration with defaults:
- `preferredCategories`: null (all categories)
- `preferredVibes`: null (all vibes)
- `minBusyness`: null (all levels)
- `notificationsEnabled`: true
- `emailNotifications`: true
- `offerNotifications`: true
- `busynessNotifications`: false

Preferences can be updated via the Users module endpoints.

---

### 5. Venue Owner Features

#### Create Venue
**Endpoint:** `POST /venues` (Authenticated)

**Request:**
```json
{
  "cityId": "3ff5e526-7819-45d5-9995-bd6db919c9b2",
  "name": "My New Bar",
  "category": "BAR",
  "address": "123 Main Street",
  "postcode": "M1 1AA",
  "lat": 53.4808,
  "lng": -2.2426,
  "description": "Best bar in town"
}
```

#### Update Busyness/Vibe
**Endpoint:** `PATCH /venues/:id/live-state` (Authenticated, Owner Only)

**Request:**
```json
{
  "busyness": "BUSY",
  "vibe": "PARTY"
}
```

#### Create Offer
**Endpoint:** `POST /offers` (Authenticated, Venue Owner)

**Request:**
```json
{
  "venueId": "uuid",
  "title": "Happy Hour",
  "description": "2 for 1 drinks",
  "offerType": "DISCOUNT",
  "minBusyness": "QUIET",
  "startsAt": "2026-02-15T17:00:00.000Z",
  "endsAt": "2026-02-15T19:00:00.000Z"
}
```

#### View Analytics
**Endpoint:** `GET /analytics/owner/dashboard` (Authenticated, Owner)

**Response:**
```json
{
  "venues": [
    {
      "id": "uuid",
      "name": "My Bar",
      "category": "BAR",
      "totalOffers": 5,
      "activeOffers": 2,
      "totalViews": 245,
      "totalRedemptions": 23,
      "conversionRate": 9.39
    }
  ],
  "summary": {
    "totalVenues": 1,
    "totalOffers": 5,
    "totalViews": 245,
    "totalRedemptions": 23,
    "overallConversionRate": 9.39
  }
}
```

---

## Response Formats

### Success Response
All successful responses return JSON with appropriate HTTP status codes:
- `200 OK` - Successful GET/PATCH/DELETE
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE (no body)

### Error Response
All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "timestamp": "2026-02-15T10:00:00.000Z"
}
```

**Common Error Codes:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., email exists)
- `500 Internal Server Error` - Server error

---

## Error Handling

### iOS Implementation Example

```swift
func handleAPIError(_ error: Error) {
    if let data = (error as? URLError)?.failureURL {
        do {
            let errorResponse = try JSONDecoder().decode(APIError.self, from: data)
            
            switch errorResponse.statusCode {
            case 401:
                // Token expired, refresh and retry
                refreshToken()
            case 403:
                // Show permission denied alert
                showAlert("Access Denied")
            case 404:
                // Resource not found
                showAlert("Not Found")
            default:
                showAlert(errorResponse.message)
            }
        } catch {
            showAlert("Network error")
        }
    }
}
```

---

## Rate Limiting

Currently, there is no rate limiting on the development server. For production, implement client-side throttling:
- Search queries: Debounce by 300ms
- Analytics calls: Cache for 5 minutes
- Notifications: Poll every 30 seconds max

---

## Best Practices

### 1. Token Management
- Store tokens securely in Keychain (iOS)
- Implement automatic token refresh before expiration
- Clear tokens on logout
- Handle 401 responses gracefully

### 2. Caching Strategy
- Cache venue list for 5 minutes
- Cache venue details for 10 minutes
- Always fetch live busyness/vibe on venue view
- Cache user preferences until updated

### 3. Offline Support
- Cache essential data for offline viewing
- Queue actions (offer redemptions) when offline
- Sync when connection restored

### 4. Performance
- Use pagination for large lists (though Manchester has limited venues)
- Lazy load images
- Implement pull-to-refresh
- Show loading states

### 5. Analytics Tracking
- Call `/offers/:id/view` when user views offer details
- Call `/offers/:id/click` when user taps "View Offer" button
- Track screen views and user actions locally

---

## Testing Environment

**Test User Accounts:**
- Email: `test@example.com`
- Password: `password123`

**Test Venue Owner:**
- Create via `/auth/register` with any email
- Venue ownership assigned on venue creation

**Manchester City ID:**
```
3ff5e526-7819-45d5-9995-bd6db919c9b2
```

**Test Coordinates (Manchester City Center):**
- Latitude: `53.4808`
- Longitude: `-2.2426`

---

## Support & Questions

For API questions or issues:
1. Check Swagger documentation at `/api`
2. Review test scripts in the repository
3. Contact backend team

**Test Scripts Available:**
- `test-auth.ps1` - Authentication flow
- `test-venues.ps1` - Venue endpoints
- `test-offers.ps1` - Offer endpoints
- `test-discovery.ps1` - Discovery & filtering
- `test-automation.ps1` - Time-based features
- `test-analytics.ps1` - Analytics endpoints
