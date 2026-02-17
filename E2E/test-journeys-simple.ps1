# ============================================
# REKI - User Journeys Test (Simplified)
# Tests USER, BUSINESS, and ADMIN journeys
# ============================================

$baseUrl = "http://localhost:3000"
$passed = 0
$failed = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  REKI USER JOURNEYS TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check server
Write-Host "[PRE] Checking server..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/" -TimeoutSec 5
    Write-Host "  ✓ Server is running" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ✗ Server is not running!" -ForegroundColor Red
    Write-Host "  Please start the server with: npm run start:dev" -ForegroundColor Yellow
    exit 1
}

# ============================================
# JOURNEY 1: REGULAR USER
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOURNEY 1: Regular User (USER)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1.1 Register User
Write-Host "[1.1] User Registration..." -ForegroundColor Yellow
$userEmail = "testuser_$(Get-Random)@example.com"
$userPass = "TestPass123!"

try {
    $register = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body (@{
        email = $userEmail
        password = $userPass
    } | ConvertTo-Json)
    
    Write-Host "  ✓ User registered: $userEmail" -ForegroundColor Green
    Write-Host "  ℹ Role: $($register.user.role)" -ForegroundColor Cyan
    $userToken = $register.access_token
    $passed++
} catch {
    Write-Host "  ✗ Registration failed" -ForegroundColor Red
    $failed++
}

# 1.2 Set Preferences
if ($userToken) {
    Write-Host "[1.2] Setting user preferences..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        $prefs = Invoke-RestMethod -Uri "$baseUrl/users/me/preferences" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{
            preferredVibes = @("Energetic", "Social")
            preferredCategories = @("Bar", "Restaurant")
            minBusyness = "Moderate"
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Preferences set" -ForegroundColor Green
        Write-Host "  ℹ Vibes: $($prefs.preferredVibes -join ', ')" -ForegroundColor Cyan
        $passed++
    } catch {
        Write-Host "  ✗ Preferences failed" -ForegroundColor Red
        $failed++
    }
}

# 1.3 Discover Venues
Write-Host "[1.3] Discovering venues..." -ForegroundColor Yellow
try {
    $venues = Invoke-RestMethod -Uri "$baseUrl/venues?lat=53.4808`&lng=-2.2426`&maxDistance=10"
    Write-Host "  ✓ Found $($venues.length) venues" -ForegroundColor Green
    if ($venues.length -gt 0) {
        $testVenue = $venues[0]
        Write-Host "  ℹ Sample: $($testVenue.name) - $($testVenue.liveState.busynessLevel)" -ForegroundColor Cyan
        $venueId = $testVenue.id
    }
    $passed++
} catch {
    Write-Host "  ✗ Venue discovery failed" -ForegroundColor Red
    $failed++
}

# 1.4 View Venue Details
if ($venueId) {
    Write-Host "[1.4] Viewing venue details..." -ForegroundColor Yellow
    try {
        $venueDetail = Invoke-RestMethod -Uri "$baseUrl/venues/$venueId"
        Write-Host "  ✓ Venue details loaded: $($venueDetail.name)" -ForegroundColor Green
        Write-Host "  ℹ Address: $($venueDetail.address)" -ForegroundColor Cyan
        $passed++
    } catch {
        Write-Host "  ✗ Venue details failed" -ForegroundColor Red
        $failed++
    }
}

# 1.5 Track View
if ($venueId -and $userToken) {
    Write-Host "[1.5] Tracking venue view..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        Invoke-RestMethod -Uri "$baseUrl/analytics/venues/$venueId/track-view" -Method POST -Headers $headers | Out-Null
        Write-Host "  ✓ View tracked" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ View tracking failed" -ForegroundColor Red
        $failed++
    }
}

# 1.6 Browse Offers
Write-Host "[1.6] Browsing offers..." -ForegroundColor Yellow
try {
    $offers = Invoke-RestMethod -Uri "$baseUrl/offers"
    Write-Host "  ✓ Found $($offers.length) offers" -ForegroundColor Green
    if ($offers.length -gt 0) {
        $testOffer = $offers[0]
        Write-Host "  ℹ Sample: $($testOffer.title) at $($testOffer.venue.name)" -ForegroundColor Cyan
        $offerId = $testOffer.id
    }
    $passed++
} catch {
    Write-Host "  ✗ Offers browse failed" -ForegroundColor Red
    $failed++
}

# 1.7 Track Offer Engagement
if ($offerId -and $userToken) {
    Write-Host "[1.7] Tracking offer engagement..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        Invoke-RestMethod -Uri "$baseUrl/analytics/offers/$offerId/track-impression" -Method POST -Headers $headers | Out-Null
        Invoke-RestMethod -Uri "$baseUrl/analytics/offers/$offerId/track-click" -Method POST -Headers $headers | Out-Null
        Write-Host "  ✓ Engagement tracked (impression + click)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Engagement tracking failed" -ForegroundColor Red
        $failed++
    }
}

# 1.8 Redeem Offer
if ($offerId -and $userToken) {
    Write-Host "[1.8] Redeeming offer..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        $redemption = Invoke-RestMethod -Uri "$baseUrl/offers/$offerId/redeem" -Method POST -Headers $headers
        Write-Host "  ✓ Offer redeemed successfully" -ForegroundColor Green
        Write-Host "  ℹ Redemption ID: $($redemption.id)" -ForegroundColor Cyan
        $passed++
    } catch {
        Write-Host "  ✗ Redemption failed" -ForegroundColor Red
        $failed++
    }
}

# 1.9 View Notifications
if ($userToken) {
    Write-Host "[1.9] Viewing notifications..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        $notifications = Invoke-RestMethod -Uri "$baseUrl/notifications/me" -Headers $headers
        Write-Host "  ✓ Notifications loaded: $($notifications.total) total, $($notifications.unreadCount) unread" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Notifications failed" -ForegroundColor Red
        $failed++
    }
}

# 1.10 View Profile
if ($userToken) {
    Write-Host "[1.10] Viewing user profile..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        $profile = Invoke-RestMethod -Uri "$baseUrl/users/me" -Headers $headers
        Write-Host "  ✓ Profile loaded: $($profile.email)" -ForegroundColor Green
        Write-Host "  ℹ Role: $($profile.role), Active: $($profile.isActive)" -ForegroundColor Cyan
        $passed++
    } catch {
        Write-Host "  ✗ Profile failed" -ForegroundColor Red
        $failed++
    }
}

# 1.11 Test RBAC - User should NOT create venue
if ($userToken) {
    Write-Host "[1.11] Testing RBAC: User cannot create venue..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        Invoke-RestMethod -Uri "$baseUrl/venues" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
            name = "Test Venue"
            category = "Bar"
        } | ConvertTo-Json) -ErrorAction Stop
        Write-Host "  ✗ RBAC FAILED: User should not create venues!" -ForegroundColor Red
        $failed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "  ✓ RBAC working: User correctly denied (403 Forbidden)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ✗ RBAC test failed with wrong error" -ForegroundColor Red
            $failed++
        }
    }
}

# ============================================
# JOURNEY 2: BUSINESS OWNER
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOURNEY 2: Business Owner (BUSINESS)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 2.1 Business Login
Write-Host "[2.1] Business owner login..." -ForegroundColor Yellow
try {
    $business = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
        email = "owner@test.com"
        password = "password123"
    } | ConvertTo-Json)
    
    Write-Host "  ✓ Business owner logged in" -ForegroundColor Green
    Write-Host "  ℹ Role: $($business.user.role)" -ForegroundColor Cyan
    $businessToken = $business.access_token
    $passed++
} catch {
    Write-Host "  ✗ Business login failed" -ForegroundColor Red
    Write-Host "  ℹ Note: Ensure owner@test.com exists with BUSINESS role" -ForegroundColor Yellow
    $failed++
}

# 2.2 View Dashboard
if ($businessToken) {
    Write-Host "[2.2] Viewing owner dashboard..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
        $endDate = (Get-Date).ToString("yyyy-MM-dd")
        $dashboard = Invoke-RestMethod -Uri "$baseUrl/analytics/owner/dashboard?startDate=$startDate`&endDate=$endDate" -Headers $headers
        
        Write-Host "  ✓ Dashboard loaded" -ForegroundColor Green
        Write-Host "  ℹ Views: $($dashboard.totalViews), Clicks: $($dashboard.totalOfferClicks), Redemptions: $($dashboard.totalRedemptions)" -ForegroundColor Cyan
        $passed++
    } catch {
        Write-Host "  ✗ Dashboard failed" -ForegroundColor Red
        $failed++
    }
}

# 2.3 Get Owned Venues
if ($businessToken) {
    Write-Host "[2.3] Getting owned venues..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $ownedVenues = Invoke-RestMethod -Uri "$baseUrl/venues" -Headers $headers
        
        Write-Host "  ✓ Found $($ownedVenues.length) owned venues" -ForegroundColor Green
        if ($ownedVenues.length -gt 0) {
            $bizVenue = $ownedVenues[0]
            Write-Host "  ℹ Venue: $($bizVenue.name) - $($bizVenue.liveState.busynessLevel)" -ForegroundColor Cyan
            $bizVenueId = $bizVenue.id
        }
        $passed++
    } catch {
        Write-Host "  ✗ Owned venues failed" -ForegroundColor Red
        $failed++
    }
}

# 2.4 Update Busyness
if ($bizVenueId -and $businessToken) {
    Write-Host "[2.4] Updating venue busyness..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $updated = Invoke-RestMethod -Uri "$baseUrl/venues/$bizVenueId/live-state" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{
            busynessLevel = "Busy"
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Busyness updated to: Busy" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Busyness update failed" -ForegroundColor Red
        $failed++
    }
}

# 2.5 Update Vibe
if ($bizVenueId -and $businessToken) {
    Write-Host "[2.5] Updating venue vibe..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $updated = Invoke-RestMethod -Uri "$baseUrl/venues/$bizVenueId/live-state" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{
            currentVibe = "Energetic"
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Vibe updated to: Energetic" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Vibe update failed" -ForegroundColor Red
        $failed++
    }
}

# 2.6 Create Vibe Schedule
if ($bizVenueId -and $businessToken) {
    Write-Host "[2.6] Creating vibe schedule..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $schedule = Invoke-RestMethod -Uri "$baseUrl/venues/$bizVenueId/vibe-schedules" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
            dayOfWeek = 5
            startTime = "18:00"
            endTime = "23:00"
            vibeType = "Energetic"
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Vibe schedule created: Friday 18:00-23:00 Energetic" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Vibe schedule creation failed" -ForegroundColor Red
        $failed++
    }
}

# 2.7 Create Offer
if ($bizVenueId -and $businessToken) {
    Write-Host "[2.7] Creating offer..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        $endDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
        
        $offer = Invoke-RestMethod -Uri "$baseUrl/offers" -Method POST -Headers $headers -ContentType "application/json" -Body (@{
            venueId = $bizVenueId
            title = "Test Happy Hour 50% Off"
            description = "Test offer for journey validation"
            offerType = "Percentage"
            discountValue = 50
            startDate = $startDate
            endDate = $endDate
            maxRedemptions = 100
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Offer created: $($offer.title)" -ForegroundColor Green
        $bizOfferId = $offer.id
        $passed++
    } catch {
        Write-Host "  ✗ Offer creation failed" -ForegroundColor Red
        $failed++
    }
}

# 2.8 Deactivate Offer
if ($bizOfferId -and $businessToken) {
    Write-Host "[2.8] Deactivating offer..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $deactivated = Invoke-RestMethod -Uri "$baseUrl/offers/$bizOfferId/status" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{
            isActive = $false
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Offer deactivated" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Offer deactivation failed" -ForegroundColor Red
        $failed++
    }
}

# 2.9 View Venue Analytics
if ($bizVenueId -and $businessToken) {
    Write-Host "[2.9] Viewing venue analytics..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
        $endDate = (Get-Date).ToString("yyyy-MM-dd")
        $analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/venues/$bizVenueId?startDate=$startDate`&endDate=$endDate" -Headers $headers
        
        Write-Host "  ✓ Venue analytics retrieved" -ForegroundColor Green
        Write-Host "  ℹ Views: $($analytics.totalViews), Visitors: $($analytics.uniqueVisitors), Clicks: $($analytics.offerClicks)" -ForegroundColor Cyan
        $passed++
    } catch {
        Write-Host "  ✗ Venue analytics failed" -ForegroundColor Red
        $failed++
    }
}

# 2.10 Test RBAC - Business should NOT access platform analytics
if ($businessToken) {
    Write-Host "[2.10] Testing RBAC: Business cannot access platform analytics..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $businessToken" }
        Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement" -Headers $headers -ErrorAction Stop
        Write-Host "  ✗ RBAC FAILED: Business should not access platform analytics!" -ForegroundColor Red
        $failed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "  ✓ RBAC working: Business correctly denied (403 Forbidden)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ✗ RBAC test failed with wrong error" -ForegroundColor Red
            $failed++
        }
    }
}

# ============================================
# JOURNEY 3: ADMIN
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOURNEY 3: Platform Admin (ADMIN)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 3.1 Admin Login
Write-Host "[3.1] Admin login..." -ForegroundColor Yellow
try {
    $admin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{
        email = "admin@reki.com"
        password = "admin123"
    } | ConvertTo-Json)
    
    Write-Host "  ✓ Admin logged in" -ForegroundColor Green
    Write-Host "  ℹ Role: $($admin.user.role)" -ForegroundColor Cyan
    $adminToken = $admin.access_token
    $passed++
} catch {
    Write-Host "  ✗ Admin login failed" -ForegroundColor Red
    Write-Host "  ℹ Note: Create admin with: UPDATE users SET role = 'ADMIN' WHERE email = 'admin@reki.com';" -ForegroundColor Yellow
    $failed++
}

# 3.2 View Platform Analytics
if ($adminToken) {
    Write-Host "[3.2] Viewing platform analytics (ADMIN only)..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $adminToken" }
        $startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
        $endDate = (Get-Date).ToString("yyyy-MM-dd")
        $platformAnalytics = Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement?startDate=$startDate`&endDate=$endDate" -Headers $headers
        
        Write-Host "  ✓ Platform analytics retrieved (ADMIN access confirmed)" -ForegroundColor Green
        Write-Host "  ℹ Users: $($platformAnalytics.totalUsers), Venues: $($platformAnalytics.totalVenues), Redemptions: $($platformAnalytics.totalRedemptions)" -ForegroundColor Cyan
        $passed++
    } catch {
        Write-Host "  ✗ Platform analytics failed" -ForegroundColor Red
        $failed++
    }
}

# 3.3 Admin Override - Update Any Venue
if ($adminToken -and $venueId) {
    Write-Host "[3.3] Testing admin override: Update any venue..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $adminToken" }
        $adminUpdate = Invoke-RestMethod -Uri "$baseUrl/venues/$venueId/live-state" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{
            busynessLevel = "Quiet"
            currentVibe = "Chill"
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Admin successfully updated venue without ownership (Override confirmed)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Admin override failed" -ForegroundColor Red
        $failed++
    }
}

# 3.4 Admin Override - Manage Any Offer
if ($adminToken -and $offerId) {
    Write-Host "[3.4] Testing admin override: Manage any offer..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $adminToken" }
        $adminOffer = Invoke-RestMethod -Uri "$baseUrl/offers/$offerId/status" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{
            isActive = $true
        } | ConvertTo-Json)
        
        Write-Host "  ✓ Admin successfully managed offer without ownership (Override confirmed)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ✗ Admin offer override failed" -ForegroundColor Red
        $failed++
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$total = $passed + $failed
$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "Tests Passed: " -NoNewline
Write-Host $passed -ForegroundColor Green

Write-Host "Tests Failed: " -NoNewline
Write-Host $failed -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

Write-Host "Success Rate: " -NoNewline
Write-Host "$successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })

if ($successRate -eq 100) {
    Write-Host "`n🎉 ALL JOURNEYS COMPLETED SUCCESSFULLY! 🎉" -ForegroundColor Green
    Write-Host "The REKI MVP backend is fully functional!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "`n✅ Most journeys working - minor issues" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Critical issues detected" -ForegroundColor Red
}
