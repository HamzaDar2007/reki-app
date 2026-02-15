# REKI API Sample Calls & Testing Guide

## Table of Contents
- [Testing Tools](#testing-tools)
- [Postman Collection](#postman-collection)
- [Authentication Examples](#authentication-examples)
- [Core API Examples](#core-api-examples)
- [Demo Scenarios](#demo-scenarios)
- [Testing Workflows](#testing-workflows)

---

## Testing Tools

### 1. Postman (Recommended)

**Import Collection:**
- Open Postman
- File → Import
- Select: `postman/REKI-MVP-API.postman_collection.json`
- Collection variables will be auto-configured

**Collection Variables:**
```json
{
  "baseUrl": "http://localhost:3000",
  "manchesterCityId": "3ff5e526-7819-45d5-9995-bd6db919c9b2"
}
```

### 2. Swagger UI

**Access:** `http://localhost:3000/api`

- Interactive API documentation
- Try endpoints directly in browser
- Auto-generated from NestJS decorators
- Includes request/response schemas

### 3. cURL (Command Line)

All examples below include cURL commands for terminal testing.

### 4. PowerShell Test Scripts

Located in project root:
- `test-auth.ps1` - Authentication flow
- `test-venues.ps1` - Venue discovery
- `test-offers.ps1` - Offer management
- `test-automation.ps1` - Automation demo
- `test-analytics.ps1` - Analytics testing
- `test-notifications.ps1` - Notification system

---

## Authentication Examples

### 1. Register New User

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**PowerShell:**
```powershell
$body = @{
    email = "newuser@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
    -Method Post -Body $body -ContentType "application/json"

Write-Host "Access Token: $($response.accessToken)"
Write-Host "User ID: $($response.user.id)"
```

### 2. Login

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com"
  }
}
```

### 3. Refresh Token

**Request:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. Get Current User

**Request:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### 5. Forgot Password

**Request:**
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

### 6. Reset Password

**Request:**
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "newpassword123"
  }'
```

**Response:**
```json
{
  "message": "Password has been reset successfully"
}
```

---

## Core API Examples

### Cities

#### Get All Cities

**Request:**
```bash
curl -X GET http://localhost:3000/cities
```

**Response:**
```json
[
  {
    "id": "3ff5e526-7819-45d5-9995-bd6db919c9b2",
    "name": "Manchester",
    "country": "United Kingdom",
    "timezone": "Europe/London",
    "isActive": true
  }
]
```

#### Get Manchester

**Request:**
```bash
curl -X GET http://localhost:3000/cities/manchester
```

**Response:**
```json
{
  "id": "3ff5e526-7819-45d5-9995-bd6db919c9b2",
  "name": "Manchester",
  "country": "United Kingdom",
  "timezone": "Europe/London",
  "isActive": true
}
```

---

### Venues

#### Get All Venues (Basic)

**Request:**
```bash
curl -X GET "http://localhost:3000/venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2"
```

**Response:**
```json
[
  {
    "id": "venue-uuid-1",
    "name": "Albert's Schloss",
    "category": "BAR",
    "address": "27 Peter Street",
    "postcode": "M2 5QR",
    "lat": 53.478,
    "lng": -2.246,
    "coverImageUrl": "https://example.com/image.jpg",
    "description": "Bavarian-inspired bar with live music",
    "currentBusyness": "MODERATE",
    "currentVibe": "PARTY",
    "activeOffers": [
      {
        "id": "offer-uuid-1",
        "title": "Happy Hour Special",
        "description": "50% off all cocktails",
        "offerType": "DISCOUNT"
      }
    ]
  }
]
```

#### Get Venues with Filters

**Request:**
```bash
curl -X GET "http://localhost:3000/venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2&category=BAR&minBusyness=MODERATE&vibes=PARTY&hasActiveOffers=true&limit=10"
```

**Query Parameters:**
- `cityId` (required): City UUID
- `category`: BAR, CLUB, RESTAURANT
- `minBusyness`: QUIET, MODERATE, BUSY
- `vibes`: CHILL, PARTY, LIVE_MUSIC, SPORTS (comma-separated)
- `hasActiveOffers`: true/false
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**PowerShell:**
```powershell
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"
$params = @{
    cityId = $manchesterId
    category = "BAR"
    minBusyness = "MODERATE"
    vibes = "PARTY"
    hasActiveOffers = "true"
    limit = 10
}

$queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
$response = Invoke-RestMethod -Uri "http://localhost:3000/venues?$queryString"

Write-Host "Found $($response.Count) venues"
$response | Format-Table name, category, currentBusyness, currentVibe
```

#### Get Venue Details

**Request:**
```bash
curl -X GET "http://localhost:3000/venues/{venueId}"
```

**Response:**
```json
{
  "id": "venue-uuid-1",
  "name": "Albert's Schloss",
  "category": "BAR",
  "address": "27 Peter Street",
  "postcode": "M2 5QR",
  "lat": 53.478,
  "lng": -2.246,
  "description": "Bavarian-inspired bar with live music",
  "currentBusyness": "MODERATE",
  "currentVibe": "PARTY",
  "vibeSchedules": [
    {
      "dayOfWeek": 5,
      "startTime": "18:00:00",
      "endTime": "23:00:00",
      "vibe": "PARTY"
    }
  ],
  "activeOffers": [
    {
      "id": "offer-uuid-1",
      "title": "Happy Hour Special",
      "description": "50% off all cocktails",
      "offerType": "DISCOUNT",
      "minBusyness": "QUIET",
      "startsAt": "2024-01-01T17:00:00Z",
      "endsAt": "2024-12-31T20:00:00Z"
    }
  ]
}
```

#### Get Venue Live State

**Request:**
```bash
curl -X GET "http://localhost:3000/venues/{venueId}/live-state" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "venueId": "venue-uuid-1",
  "busyness": "MODERATE",
  "vibe": "PARTY",
  "busynessUpdatedAt": "2024-01-15T20:30:00.000Z",
  "vibeUpdatedAt": "2024-01-15T18:00:00.000Z"
}
```

---

### Offers

#### Get Venue Offers

**Request:**
```bash
curl -X GET "http://localhost:3000/venues/{venueId}/offers"
```

**Response:**
```json
[
  {
    "id": "offer-uuid-1",
    "title": "Happy Hour Special",
    "description": "50% off all cocktails from 5-8pm",
    "offerType": "DISCOUNT",
    "minBusyness": "QUIET",
    "startsAt": "2024-01-01T17:00:00Z",
    "endsAt": "2024-12-31T20:00:00Z",
    "isActive": true,
    "viewCount": 150,
    "clickCount": 45,
    "redeemCount": 12
  }
]
```

#### Track Offer View

**Request:**
```bash
curl -X POST "http://localhost:3000/offers/{offerId}/view" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "message": "Offer view tracked",
  "offerId": "offer-uuid-1",
  "viewCount": 151
}
```

#### Track Offer Click

**Request:**
```bash
curl -X POST "http://localhost:3000/offers/{offerId}/click" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "message": "Offer click tracked",
  "offerId": "offer-uuid-1",
  "clickCount": 46
}
```

#### Redeem Offer

**Request:**
```bash
curl -X POST "http://localhost:3000/offers/{offerId}/redeem" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Offer redeemed successfully",
  "redemption": {
    "id": "redemption-uuid-1",
    "offerId": "offer-uuid-1",
    "userId": "user-uuid-1",
    "venueId": "venue-uuid-1",
    "redeemedAt": "2024-01-15T20:45:00.000Z"
  }
}
```

---

### User Preferences

#### Get User Preferences

**Request:**
```bash
curl -X GET "http://localhost:3000/users/preferences" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "userId": "user-uuid-1",
  "preferredCategories": ["BAR", "CLUB"],
  "minBusyness": "MODERATE",
  "preferredVibes": ["PARTY", "LIVE_MUSIC"],
  "notificationsEnabled": true,
  "emailNotifications": true,
  "offerNotifications": true,
  "busynessNotifications": false
}
```

#### Update User Preferences

**Request:**
```bash
curl -X PUT "http://localhost:3000/users/preferences" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredCategories": ["BAR"],
    "minBusyness": "QUIET",
    "preferredVibes": ["CHILL", "LIVE_MUSIC"],
    "notificationsEnabled": true,
    "offerNotifications": true
  }'
```

**Response:**
```json
{
  "userId": "user-uuid-1",
  "preferredCategories": ["BAR"],
  "minBusyness": "QUIET",
  "preferredVibes": ["CHILL", "LIVE_MUSIC"],
  "notificationsEnabled": true,
  "offerNotifications": true
}
```

---

### Notifications

#### Get User Notifications

**Request:**
```bash
curl -X GET "http://localhost:3000/notifications" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
[
  {
    "id": "notification-uuid-1",
    "type": "OFFER_AVAILABLE",
    "title": "New Offer Available!",
    "message": "Check out the new Happy Hour at Albert's Schloss",
    "data": {
      "offerId": "offer-uuid-1",
      "venueId": "venue-uuid-1",
      "venueName": "Albert's Schloss"
    },
    "isRead": false,
    "createdAt": "2024-01-15T18:00:00.000Z"
  }
]
```

#### Get Unread Count

**Request:**
```bash
curl -X GET "http://localhost:3000/notifications/unread-count" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "unreadCount": 5
}
```

#### Mark Notification as Read

**Request:**
```bash
curl -X PATCH "http://localhost:3000/notifications/{notificationId}/read" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

#### Mark All as Read

**Request:**
```bash
curl -X PATCH "http://localhost:3000/notifications/mark-all-read" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

---

## Demo Scenarios

### 1. Friday Evening Simulation

**Purpose**: Simulate busy Friday night with PARTY vibes

**Request:**
```bash
curl -X POST "http://localhost:3000/demo/friday-evening"
```

**Response:**
```json
{
  "message": "Friday evening simulation applied",
  "updatedVenues": 22,
  "changes": {
    "busynessSet": "BUSY/MODERATE mix",
    "vibesSet": "PARTY dominant",
    "timestamp": "2024-01-15T22:00:00.000Z"
  }
}
```

**PowerShell:**
```powershell
# Run Friday evening simulation
$response = Invoke-RestMethod -Uri "http://localhost:3000/demo/friday-evening" -Method Post
Write-Host "Simulated: $($response.message)"

# Verify venues are busy
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"
$venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=$manchesterId"
$venues | Where-Object { $_.currentBusyness -eq "BUSY" } | Measure-Object | Select-Object -ExpandProperty Count
```

### 2. Quiet Monday Simulation

**Purpose**: Simulate quiet Monday with CHILL vibes

**Request:**
```bash
curl -X POST "http://localhost:3000/demo/quiet-monday"
```

**Response:**
```json
{
  "message": "Quiet Monday simulation applied",
  "updatedVenues": 22,
  "changes": {
    "busynessSet": "QUIET/MODERATE mix",
    "vibesSet": "CHILL dominant",
    "timestamp": "2024-01-15T14:00:00.000Z"
  }
}
```

### 3. Mixed Busyness Simulation

**Purpose**: Realistic mix of busyness levels

**Request:**
```bash
curl -X POST "http://localhost:3000/demo/mixed-busyness"
```

**Response:**
```json
{
  "message": "Mixed busyness simulation applied",
  "updatedVenues": 22,
  "changes": {
    "quiet": 8,
    "moderate": 9,
    "busy": 5
  }
}
```

### 4. Reset Demo

**Purpose**: Reset all venues to default state

**Request:**
```bash
curl -X POST "http://localhost:3000/demo/reset"
```

**Response:**
```json
{
  "message": "Demo state reset successfully",
  "resetVenues": 22
}
```

---

## Testing Workflows

### Complete User Journey

**PowerShell Script:**
```powershell
# 1. Register new user
$registerBody = @{
    email = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
    -Method Post -Body $registerBody -ContentType "application/json"

$token = $auth.accessToken
Write-Host "✅ Registered user: $($auth.user.email)"

# 2. Get Manchester venues
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"
$venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=$manchesterId"
Write-Host "✅ Found $($venues.Count) venues"

# 3. Filter venues by category
$bars = $venues | Where-Object { $_.category -eq "BAR" }
Write-Host "✅ Filtered to $($bars.Count) bars"

# 4. Get first bar with offers
$barWithOffer = $bars | Where-Object { $_.activeOffers.Count -gt 0 } | Select-Object -First 1
Write-Host "✅ Selected: $($barWithOffer.name)"

# 5. Track offer view
$offerId = $barWithOffer.activeOffers[0].id
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/offers/$offerId/view" `
    -Method Post -Headers $headers
Write-Host "✅ Tracked offer view"

# 6. Track offer click
Invoke-RestMethod -Uri "http://localhost:3000/offers/$offerId/click" `
    -Method Post -Headers $headers
Write-Host "✅ Tracked offer click"

# 7. Redeem offer
$redemption = Invoke-RestMethod -Uri "http://localhost:3000/offers/$offerId/redeem" `
    -Method Post -Headers $headers
Write-Host "✅ Redeemed offer: $($redemption.message)"

# 8. Update preferences
$prefsBody = @{
    preferredCategories = @("BAR")
    minBusyness = "MODERATE"
    preferredVibes = @("PARTY", "LIVE_MUSIC")
    notificationsEnabled = $true
    offerNotifications = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/users/preferences" `
    -Method Put -Body $prefsBody -Headers $headers -ContentType "application/json"
Write-Host "✅ Updated preferences"

Write-Host "`n🎉 Complete user journey tested successfully!"
```

### Venue Owner Journey

**PowerShell Script:**
```powershell
# 1. Login as venue owner
$loginBody = @{
    email = "owner@example.com"
    password = "password123"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
    -Method Post -Body $loginBody -ContentType "application/json"

$token = $auth.accessToken
$headers = @{ Authorization = "Bearer $token" }

# 2. Get owned venues
$venues = Invoke-RestMethod -Uri "http://localhost:3000/venues/owner/my-venues" -Headers $headers
$venueId = $venues[0].id
Write-Host "✅ Managing venue: $($venues[0].name)"

# 3. Create new offer
$offerBody = @{
    venueId = $venueId
    title = "Weekend Special"
    description = "2 for 1 on selected drinks"
    offerType = "DISCOUNT"
    minBusyness = "QUIET"
    startsAt = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
    endsAt = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ssZ")
    isActive = $true
} | ConvertTo-Json

$newOffer = Invoke-RestMethod -Uri "http://localhost:3000/offers" `
    -Method Post -Body $offerBody -Headers $headers -ContentType "application/json"
Write-Host "✅ Created offer: $($newOffer.title)"

# 4. Update venue busyness
$stateBody = @{
    busyness = "MODERATE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/venues/$venueId/live-state" `
    -Method Patch -Body $stateBody -Headers $headers -ContentType "application/json"
Write-Host "✅ Updated busyness level"

# 5. Get analytics
$analytics = Invoke-RestMethod -Uri "http://localhost:3000/analytics/owner/dashboard" -Headers $headers
Write-Host "✅ Total offer views: $($analytics.totalViews)"
Write-Host "✅ Total redemptions: $($analytics.totalRedemptions)"

Write-Host "`n🎉 Venue owner journey tested successfully!"
```

### Automation Testing

**PowerShell Script:**
```powershell
# 1. Check automation status
$status = Invoke-RestMethod -Uri "http://localhost:3000/automation/status"
Write-Host "Vibe Automation: $($status.vibeAutomation.enabled)"
Write-Host "Busyness Simulation: $($status.busynessSimulation.enabled)"

# 2. Run Friday evening scenario
Invoke-RestMethod -Uri "http://localhost:3000/demo/friday-evening" -Method Post
Write-Host "✅ Applied Friday evening scenario"

# 3. Wait and check venue states
Start-Sleep -Seconds 2
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"
$venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=$manchesterId"

$busyCount = ($venues | Where-Object { $_.currentBusyness -eq "BUSY" }).Count
$partyCount = ($venues | Where-Object { $_.currentVibe -eq "PARTY" }).Count

Write-Host "✅ Busy venues: $busyCount"
Write-Host "✅ Party vibe venues: $partyCount"

# 4. Manual vibe update
$venueId = $venues[0].id
$updateBody = @{
    busyness = "QUIET"
    vibe = "CHILL"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/automation/venues/$venueId/manual-update" `
    -Method Post -Body $updateBody -ContentType "application/json"
Write-Host "✅ Manual update successful"

Write-Host "`n🎉 Automation testing complete!"
```

---

## Error Examples

### 400 Bad Request

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

**Response:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized

**Request:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer invalid-token"
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found

**Request:**
```bash
curl -X GET http://localhost:3000/venues/non-existent-uuid
```

**Response:**
```json
{
  "statusCode": 404,
  "message": "Venue not found",
  "error": "Not Found"
}
```

### 409 Conflict

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

## Quick Reference

### Base URL
```
http://localhost:3000
```

### Manchester City ID
```
3ff5e526-7819-45d5-9995-bd6db919c9b2
```

### Test Credentials
```
Email: test@example.com
Password: password123
```

### Common Headers
```
Content-Type: application/json
Authorization: Bearer {accessToken}
```

### PowerShell Test Scripts
```powershell
# Run all tests
.\test-auth.ps1
.\test-venues.ps1
.\test-offers.ps1
.\test-discovery.ps1
.\test-automation.ps1
.\test-analytics.ps1
.\test-notifications.ps1
```

### Postman Collection Variables
```
baseUrl: http://localhost:3000
manchesterCityId: 3ff5e526-7819-45d5-9995-bd6db919c9b2
```

---

## Next Steps

1. **Import Postman Collection**: Start with pre-configured requests
2. **Test Authentication Flow**: Register → Login → Refresh Token
3. **Test Discovery**: Get venues with filters
4. **Test Offers**: View → Click → Redeem flow
5. **Run Demo Scenarios**: Friday evening, Quiet Monday
6. **Test Analytics**: View owner dashboard
7. **Test Automation**: Check vibe switching, busyness simulation

For detailed implementation guides, see:
- [API Integration Guide](./API-INTEGRATION-GUIDE.md)
- [Authentication Flow](./AUTHENTICATION-FLOW.md)
- [Environment Setup](./ENVIRONMENT-SETUP.md)
- [Database Setup](./DATABASE-SETUP.md)
