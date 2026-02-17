# REKI User Journeys - Complete Flows

This document outlines the complete user journeys for all user types in the REKI MVP, mapping UI screens to backend API endpoints.

---

## 🙋‍♂️ Regular User Journey (USER Role)

### **Step 1: Onboarding & Authentication**

#### 1.1 Splash Screen
- **Screen**: REKI logo with loading
- **Backend**: No API call (local screen)

#### 1.2 Login / Signup Choice
- **Screen**: "Find your vibe" with Login/Signup buttons
- **Backend**: No API call (navigation screen)

#### 1.3 Sign Up
- **Screen**: Email and password input form
- **API Endpoint**: `POST /auth/register`
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "isActive": true
    },
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token"
  }
  ```

#### 1.4 Login (Returning Users)
- **Screen**: Email and password input form
- **API Endpoint**: `POST /auth/login`
- **Request**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token"
  }
  ```

---

### **Step 2: Preferences Setup**

#### 2.1 Choose Your Vibes
- **Screen**: Multi-select vibe types (Chill, Energetic, Romantic, Social, Mixed)
- **API Endpoint**: `PATCH /users/me/preferences`
- **Request**:
  ```json
  {
    "preferredVibes": ["Energetic", "Social", "Mixed"],
    "preferredCategories": ["Bar", "Restaurant"],
    "minBusyness": "Moderate"
  }
  ```
- **Response**:
  ```json
  {
    "userId": "uuid",
    "preferredVibes": ["Energetic", "Social", "Mixed"],
    "preferredCategories": ["Bar", "Restaurant"],
    "minBusyness": "Moderate",
    "notificationsEnabled": true
  }
  ```

---

### **Step 3: Home / Venue Discovery**

#### 3.1 Venue List View (Map + Cards)
- **Screen**: Manchester map with venue pins and venue cards
- **API Endpoint**: `GET /venues`
- **Query Parameters**:
  - `cityId`: Manchester UUID
  - `lat`: User latitude (53.4808)
  - `lng`: User longitude (-2.2426)
  - `category`: Optional filter (Bar, Restaurant, Hotel, Casino)
  - `busyness`: Optional filter (Quiet, Moderate, Busy)
  - `vibe`: Optional filter (Chill, Energetic, etc.)
  - `maxDistance`: Optional (in km)
- **Response**:
  ```json
  {
    "venues": [
      {
        "id": "uuid",
        "name": "Albert's Schloss",
        "category": "Bar",
        "description": "Bavarian-inspired beer hall...",
        "address": "27 Peter St, Manchester M2 5QR",
        "latitude": 53.4781,
        "longitude": -2.2465,
        "distance": 0.5,
        "images": ["image_url_1"],
        "liveState": {
          "busynessLevel": "Moderate",
          "currentVibe": "Energetic",
          "lastUpdated": "2026-02-17T09:00:00Z"
        },
        "activeOffersCount": 2
      }
    ],
    "total": 20
  }
  ```

#### 3.2 Filter Venues
- **Screen**: Filter modal (Location, Filters, Price Range, Vibe, Busyness)
- **API Endpoint**: `GET /venues` (same as above with different filters)

---

### **Step 4: Venue Details**

#### 4.1 View Venue Details
- **Screen**: Venue detail page with images, busyness, vibe, description, offers
- **API Endpoint**: `GET /venues/:id`
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "The Alchemist",
    "category": "Bar",
    "description": "Theatre of cocktails and dining...",
    "address": "3 Hardman Square, Spinningfields",
    "phone": "+441234567890",
    "latitude": 53.4791,
    "longitude": -2.2515,
    "priceRange": "£££",
    "images": ["image_url_1", "image_url_2"],
    "liveState": {
      "busynessLevel": "Busy",
      "currentVibe": "Energetic",
      "lastUpdated": "2026-02-17T09:00:00Z"
    },
    "vibeSchedules": [
      {
        "dayOfWeek": 5,
        "startTime": "18:00",
        "endTime": "23:00",
        "vibeType": "Energetic"
      }
    ]
  }
  ```

#### 4.2 Track Venue View (Analytics)
- **Automatic**: When user views venue details
- **API Endpoint**: `POST /analytics/venues/:venueId/track-view`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: 201 Created

---

### **Step 5: Offers**

#### 5.1 View Available Offers
- **Screen**: Offer cards showing discount, venue name, expiry
- **API Endpoint**: `GET /offers`
- **Query Parameters**:
  - `venueId`: Optional (filter by specific venue)
  - `status`: "Active"
  - `cityId`: Manchester UUID
- **Response**:
  ```json
  {
    "offers": [
      {
        "id": "uuid",
        "venue": {
          "id": "uuid",
          "name": "Dishoom",
          "category": "Restaurant"
        },
        "title": "Happy Hour - 50% Off Cocktails",
        "description": "Get 50% off all cocktails 5-7pm",
        "offerType": "Percentage",
        "discountValue": 50,
        "startDate": "2026-02-17T17:00:00Z",
        "endDate": "2026-02-17T19:00:00Z",
        "isActive": true,
        "redemptionCount": 45,
        "maxRedemptions": 100
      }
    ],
    "total": 12
  }
  ```

#### 5.2 View Offer Details
- **Screen**: Offer detail modal with Redeem button
- **API Endpoint**: `GET /offers/:id`
- **Response**: Single offer object (same structure as above)

#### 5.3 Track Offer Impression
- **Automatic**: When user views offer
- **API Endpoint**: `POST /analytics/offers/:offerId/track-impression`
- **Headers**: `Authorization: Bearer {access_token}`

#### 5.4 Track Offer Click
- **Automatic**: When user clicks on offer
- **API Endpoint**: `POST /analytics/offers/:offerId/track-click`
- **Headers**: `Authorization: Bearer {access_token}`

#### 5.5 Redeem Offer
- **Screen**: User clicks "Redeem" button
- **API Endpoint**: `POST /offers/:id/redeem`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**:
  ```json
  {
    "id": "redemption_uuid",
    "offer": { /* offer details */ },
    "user": { /* user details */ },
    "redeemedAt": "2026-02-17T18:30:00Z",
    "status": "Redeemed"
  }
  ```

---

### **Step 6: Notifications**

#### 6.1 View Notifications
- **Screen**: Notifications list (New offers, Vibe updates, Busyness changes)
- **API Endpoint**: `GET /notifications/me`
- **Query Parameters**: `unreadOnly`: true/false
- **Response**:
  ```json
  {
    "notifications": [
      {
        "id": "uuid",
        "type": "NEW_OFFER",
        "title": "New Offer at Dishoom",
        "message": "50% off cocktails during happy hour!",
        "isRead": false,
        "createdAt": "2026-02-17T16:00:00Z",
        "metadata": {
          "offerId": "uuid",
          "venueId": "uuid"
        }
      }
    ],
    "unreadCount": 5,
    "total": 23
  }
  ```

#### 6.2 Mark Notification as Read
- **Action**: User taps notification
- **API Endpoint**: `PATCH /notifications/:id/read`
- **Response**: 200 OK

#### 6.3 Update Notification Preferences
- **Screen**: Notification settings toggle switches
- **API Endpoint**: `PATCH /users/me/preferences`
- **Request**:
  ```json
  {
    "notificationsEnabled": true,
    "emailNotifications": false,
    "offerNotifications": true,
    "busynessNotifications": true
  }
  ```

---

### **Step 7: Profile & Settings**

#### 7.1 View Profile
- **Screen**: User profile with email, preferences
- **API Endpoint**: `GET /users/me`
- **Response**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "isActive": true,
    "createdAt": "2026-02-01T10:00:00Z",
    "preferences": {
      "preferredVibes": ["Energetic", "Social"],
      "preferredCategories": ["Bar", "Restaurant"],
      "notificationsEnabled": true
    }
  }
  ```

#### 7.2 Change Password
- **Screen**: Password change form
- **API Endpoint**: `POST /auth/change-password`
- **Headers**: `Authorization: Bearer {access_token}`
- **Request**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword456!"
  }
  ```

#### 7.3 Logout
- **Action**: User clicks logout
- **API Endpoint**: `POST /auth/logout`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: 200 OK (tokens blacklisted)

---

## 👔 Business Owner Journey (BUSINESS Role)

### **Step 1: Business Authentication**

#### 1.1 Business Login
- **Screen**: Business owner login screen
- **API Endpoint**: `POST /auth/login`
- **Request**:
  ```json
  {
    "email": "owner@dishoom.com",
    "password": "BusinessPass123!"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "id": "uuid",
      "email": "owner@dishoom.com",
      "role": "BUSINESS"
    },
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token"
  }
  ```

---

### **Step 2: Venue Dashboard**

#### 2.1 View Owned Venues
- **Screen**: List of venue cards with metrics
- **API Endpoint**: `GET /venues?ownerId={userId}`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**:
  ```json
  {
    "venues": [
      {
        "id": "venue_uuid",
        "name": "Dishoom",
        "category": "Restaurant",
        "liveState": {
          "busynessLevel": "Moderate",
          "currentVibe": "Chill"
        },
        "activeOffersCount": 2,
        "todayViews": 156
      }
    ]
  }
  ```

#### 2.2 View Venue Analytics Dashboard
- **Screen**: Dashboard with key metrics (Views, Clicks, Redemptions, Revenue)
- **API Endpoint**: `GET /analytics/owner/dashboard`
- **Headers**: `Authorization: Bearer {access_token}` (BUSINESS role required)
- **Query Parameters**: 
  - `startDate`: "2026-02-10"
  - `endDate`: "2026-02-17"
- **Response**:
  ```json
  {
    "totalViews": 1847,
    "totalOfferClicks": 234,
    "totalRedemptions": 89,
    "estimatedRevenue": 2450.50,
    "topVenue": {
      "id": "uuid",
      "name": "Dishoom",
      "views": 892
    },
    "topOffer": {
      "id": "uuid",
      "title": "Happy Hour 50% Off",
      "redemptions": 45
    },
    "dailyMetrics": [
      {
        "date": "2026-02-17",
        "views": 287,
        "clicks": 45,
        "redemptions": 12
      }
    ]
  }
  ```

#### 2.3 View Specific Venue Analytics
- **Screen**: Detailed venue performance metrics
- **API Endpoint**: `GET /analytics/venues/:venueId`
- **Headers**: `Authorization: Bearer {access_token}` (BUSINESS must own venue)
- **Query Parameters**: `startDate`, `endDate`
- **Response**:
  ```json
  {
    "venueId": "uuid",
    "venueName": "Dishoom",
    "totalViews": 892,
    "uniqueVisitors": 654,
    "averageViewDuration": 45,
    "offerClicks": 123,
    "redemptions": 45,
    "dailyMetrics": [
      {
        "date": "2026-02-17",
        "views": 134,
        "clicks": 23,
        "redemptions": 8,
        "busynessChanges": 5
      }
    ]
  }
  ```

---

### **Step 3: Update Venue Busyness**

#### 3.1 Update Current Busyness Level
- **Screen**: "Update Busyness" screen with Quiet/Moderate/Busy buttons
- **API Endpoint**: `PATCH /venues/:id/live-state`
- **Headers**: `Authorization: Bearer {access_token}` (BUSINESS must own venue)
- **Request**:
  ```json
  {
    "busynessLevel": "Busy"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "venue": {
      "id": "venue_uuid",
      "name": "Dishoom"
    },
    "busynessLevel": "Busy",
    "currentVibe": "Energetic",
    "lastUpdated": "2026-02-17T19:30:00Z"
  }
  ```

#### 3.2 Update Current Vibe
- **Screen**: Vibe selector (Chill/Energetic/Romantic/Social/Mixed)
- **API Endpoint**: `PATCH /venues/:id/live-state`
- **Headers**: `Authorization: Bearer {access_token}` (BUSINESS must own venue)
- **Request**:
  ```json
  {
    "currentVibe": "Energetic"
  }
  ```

---

### **Step 4: Manage Vibe Schedules**

#### 4.1 View Vibe Schedules
- **Screen**: Weekly schedule grid showing automated vibe changes
- **API Endpoint**: `GET /venues/:id`
- **See**: `vibeSchedules` array in venue object

#### 4.2 Create Vibe Schedule
- **Screen**: Create schedule form (Day, Start Time, End Time, Vibe Type)
- **API Endpoint**: `POST /venues/:id/vibe-schedules`
- **Headers**: `Authorization: Bearer {access_token}` (BUSINESS must own venue)
- **Request**:
  ```json
  {
    "dayOfWeek": 5,
    "startTime": "18:00",
    "endTime": "23:00",
    "vibeType": "Energetic"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "venueId": "venue_uuid",
    "dayOfWeek": 5,
    "startTime": "18:00",
    "endTime": "23:00",
    "vibeType": "Energetic"
  }
  ```

#### 4.3 Delete Vibe Schedule
- **Action**: Remove scheduled vibe change
- **API Endpoint**: `DELETE /venues/:venueId/vibe-schedules/:scheduleId`
- **Headers**: `Authorization: Bearer {access_token}`

---

### **Step 5: Create & Manage Offers**

#### 5.1 View Venue's Offers
- **Screen**: List of offers for the venue
- **API Endpoint**: `GET /offers?venueId={venueId}`
- **Headers**: `Authorization: Bearer {access_token}`

#### 5.2 Create New Offer
- **Screen**: "Create / Manage Offer" form (Title, Description, Type, Discount, Dates)
- **API Endpoint**: `POST /offers`
- **Headers**: `Authorization: Bearer {access_token}` (BUSINESS must own venue)
- **Request**:
  ```json
  {
    "venueId": "venue_uuid",
    "title": "Happy Hour - 50% Off Cocktails",
    "description": "Get 50% off all cocktails from 5-7pm weekdays",
    "offerType": "Percentage",
    "discountValue": 50,
    "startDate": "2026-02-17T17:00:00Z",
    "endDate": "2026-02-28T19:00:00Z",
    "maxRedemptions": 100
  }
  ```
- **Response**:
  ```json
  {
    "id": "offer_uuid",
    "venue": {
      "id": "venue_uuid",
      "name": "Dishoom"
    },
    "title": "Happy Hour - 50% Off Cocktails",
    "offerType": "Percentage",
    "discountValue": 50,
    "isActive": true,
    "redemptionCount": 0,
    "createdAt": "2026-02-17T09:00:00Z"
  }
  ```

#### 5.3 Activate/Deactivate Offer
- **Screen**: Toggle switch on offer card
- **API Endpoint**: `PATCH /offers/:id/status`
- **Headers**: `Authorization: Bearer {access_token}` (BUSINESS must own venue)
- **Request**:
  ```json
  {
    "isActive": false
  }
  ```

#### 5.4 View Offer Performance
- **Screen**: Offer analytics (Impressions, Clicks, Redemptions)
- **API Endpoint**: `GET /analytics/offers/:offerId`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**:
  ```json
  {
    "offerId": "uuid",
    "offerTitle": "Happy Hour 50% Off",
    "impressions": 456,
    "clicks": 123,
    "redemptions": 45,
    "conversionRate": 36.59,
    "estimatedRevenue": 890.50
  }
  ```

---

### **Step 6: Business Notifications**

#### 6.1 Receive Business Notifications
- **Screen**: Notifications about redemptions, venue views milestones
- **API Endpoint**: `GET /notifications/me`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: Same structure as user notifications, but content includes:
  - "Your offer has been redeemed 10 times today!"
  - "Dishoom reached 500 views this week"
  - "Your venue is currently marked as Busy"

---

## 🔐 Admin Journey (ADMIN Role)

### **Step 1: Platform-Wide Analytics**

#### 1.1 View Platform Engagement Metrics
- **API Endpoint**: `GET /analytics/platform/engagement`
- **Headers**: `Authorization: Bearer {access_token}` (ADMIN only)
- **Query Parameters**: `startDate`, `endDate`
- **Response**:
  ```json
  {
    "totalUsers": 2847,
    "activeUsers": 1235,
    "totalVenues": 20,
    "totalOffers": 45,
    "totalRedemptions": 892,
    "platformRevenue": 15678.50,
    "topVenues": [
      {
        "id": "uuid",
        "name": "Albert's Schloss",
        "views": 2341,
        "redemptions": 198
      }
    ],
    "userGrowth": [
      {
        "date": "2026-02-17",
        "newUsers": 23,
        "activeUsers": 1235
      }
    ]
  }
  ```

### **Step 2: Manage All Venues & Offers**

#### 2.1 Access Any Venue (Override Ownership)
- **Permission**: ADMIN can update any venue regardless of ownership
- **API Endpoint**: `PATCH /venues/:id/live-state` (no ownership check for ADMIN)

#### 2.2 Manage Any Offer
- **Permission**: ADMIN can create/update offers for any venue
- **API Endpoint**: `POST /offers` and `PATCH /offers/:id/status`

---

## 📱 Common API Patterns

### **Authentication Headers**
All authenticated requests must include:
```
Authorization: Bearer {access_token}
```

### **Token Refresh**
When access token expires (15 minutes):
```
POST /auth/refresh
Headers: Authorization: Bearer {refresh_token}

Response:
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token"
}
```

### **Error Responses**
Standard error format:
```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid token",
  "timestamp": "2026-02-17T09:00:00Z"
}
```

Common HTTP status codes:
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions for RBAC)
- `404` - Not Found
- `400` - Bad Request (validation error)
- `500` - Internal Server Error

---

## 🔄 Automated Backend Processes

These run automatically without user interaction:

### **1. Vibe Schedule Automation**
- **Process**: Checks vibe schedules every minute
- **Endpoint**: Internal automation service
- **Action**: Updates venue `currentVibe` based on schedule

### **2. Token Cleanup**
- **Process**: Removes expired blacklisted tokens daily
- **Endpoint**: Internal cron job
- **Action**: Cleans up `token_blacklist` table

### **3. Offer Expiration**
- **Process**: Deactivates expired offers
- **Endpoint**: Internal automation service
- **Action**: Sets `isActive = false` for expired offers

---

## 📊 RBAC Permission Matrix

| Action | USER | BUSINESS | ADMIN |
|--------|------|----------|-------|
| View venues | ✅ | ✅ | ✅ |
| View offers | ✅ | ✅ | ✅ |
| Redeem offers | ✅ | ✅ | ✅ |
| View notifications | ✅ | ✅ | ✅ |
| Update preferences | ✅ | ✅ | ✅ |
| Create venue | ❌ | ✅ (own) | ✅ (any) |
| Update busyness | ❌ | ✅ (own) | ✅ (any) |
| Manage vibe schedules | ❌ | ✅ (own) | ✅ (any) |
| Create offer | ❌ | ✅ (own venue) | ✅ (any venue) |
| Update offer status | ❌ | ✅ (own venue) | ✅ (any venue) |
| View venue analytics | ❌ | ✅ (own) | ✅ (any) |
| View owner dashboard | ❌ | ✅ | ✅ |
| View platform analytics | ❌ | ❌ | ✅ |
| Manage all content | ❌ | ❌ | ✅ |

---

## 🎯 Journey Summary

### **Regular User (USER)**
1. Sign up / Login → Get JWT tokens with USER role
2. Set preferences (vibes, categories, busyness)
3. Discover venues (filtered by preferences, location)
4. View venue details and live busyness/vibe
5. Browse and redeem offers
6. Receive notifications about new offers
7. Track all interactions for analytics

### **Business Owner (BUSINESS)**
1. Login → Get JWT tokens with BUSINESS role
2. View dashboard of owned venues
3. Update venue busyness in real-time
4. Manage vibe schedules (automated changes)
5. Create and manage offers for owned venues
6. View venue and offer performance analytics
7. Receive notifications about redemptions

### **Platform Admin (ADMIN)**
1. Login → Get JWT tokens with ADMIN role
2. Access platform-wide engagement metrics
3. Override ownership restrictions (manage any venue/offer)
4. Monitor all user and business activity
5. Access administrative controls

---

## 🚀 All Backend APIs Ready for iOS Integration

Every screen in your UI mockups has a corresponding backend endpoint implemented and protected with proper RBAC! 🎉

**Next Steps for iOS Team:**
1. Base URL: `http://localhost:3000` (development)
2. Full API docs: `http://localhost:3000/api` (Swagger UI)
3. Use JWT tokens in all authenticated requests
4. Handle token refresh when access token expires
5. Implement role-based UI (hide features user doesn't have permission for)

