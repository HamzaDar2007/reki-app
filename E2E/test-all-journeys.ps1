# ============================================
# REKI - Complete User Journeys Test Suite
# Tests all three user types with real data
# ============================================

$baseUrl = "http://localhost:3000"
$global:testResults = @{
    passed = 0
    failed = 0
    errors = @()
}

function Write-TestHeader($message) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $message" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-TestStep($step, $message) {
    Write-Host "[$step] " -NoNewline -ForegroundColor Yellow
    Write-Host $message -ForegroundColor White
}

function Write-Success($message) {
    Write-Host "  ✓ $message" -ForegroundColor Green
    $global:testResults.passed++
}

function Write-Failure($message) {
    Write-Host "  ✗ $message" -ForegroundColor Red
    $global:testResults.failed++
    $global:testResults.errors += $message
}

function Write-Info($message) {
    Write-Host "  ℹ $message" -ForegroundColor Cyan
}

function Invoke-ApiCall($method, $endpoint, $body = $null, $token = $null) {
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($token) {
            $headers["Authorization"] = "Bearer $token"
        }
        
        $params = @{
            Uri = "$baseUrl$endpoint"
            Method = $method
            Headers = $headers
            ErrorAction = "Stop"
        }
        
        if ($body) {
            $params["Body"] = ($body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{ success = $true; data = $response }
    }
    catch {
        $errorMessage = $_.ErrorDetails.Message
        if ($errorMessage) {
            try {
                $errorData = $errorMessage | ConvertFrom-Json
                return @{ success = $false; error = $errorData }
            } catch {
                return @{ success = $false; error = @{ message = $errorMessage } }
            }
        }
        return @{ success = $false; error = @{ message = $_.Exception.Message } }
    }
}

# ============================================
# TEST: Server Health Check
# ============================================
Write-TestHeader "Pre-Flight: Server Health Check"

$health = Invoke-ApiCall "GET" "/"
if ($health.success) {
    Write-Success "Server is running"
} else {
    Write-Failure "Server is not responding"
    exit 1
}

# ============================================
# JOURNEY 1: REGULAR USER (USER ROLE)
# ============================================
Write-TestHeader "JOURNEY 1: Regular User (USER Role)"

# Step 1: User Registration
Write-TestStep "1.1" "User Registration (Sign Up)"
$randomEmail = "user_$(Get-Random)@example.com"
$userPassword = "UserPass123!"

$registerResult = Invoke-ApiCall "POST" "/auth/register" @{
    email = $randomEmail
    password = $userPassword
}

if ($registerResult.success) {
    Write-Success "User registered successfully"
    Write-Info "Email: $randomEmail"
    Write-Info "User ID: $($registerResult.data.user.id)"
    Write-Info "Role: $($registerResult.data.user.role)"
    
    $global:userToken = $registerResult.data.access_token
    $global:userId = $registerResult.data.user.id
    
    if ($registerResult.data.user.role -eq "USER") {
        Write-Success "User has correct role: USER"
    } else {
        Write-Failure "User role is incorrect: $($registerResult.data.user.role)"
    }
} else {
    Write-Failure "Registration failed: $($registerResult.error.message)"
    Write-Info "Attempting login with existing test user..."
    
    # Try logging in with a test user
    $loginResult = Invoke-ApiCall "POST" "/auth/login" @{
        email = "user@test.com"
        password = "password123"
    }
    
    if ($loginResult.success) {
        Write-Success "Logged in with existing test user"
        $global:userToken = $loginResult.data.access_token
        $global:userId = $loginResult.data.user.id
    } else {
        Write-Failure "Cannot proceed without user authentication"
        exit 1
    }
}

# Step 2: Set User Preferences
Write-TestStep "1.2" "Set User Preferences (Vibes, Categories, Busyness)"

$prefsResult = Invoke-ApiCall "PATCH" "/users/me/preferences" @{
    preferredVibes = @("Energetic", "Social", "Mixed")
    preferredCategories = @("Bar", "Restaurant")
    minBusyness = "Moderate"
    notificationsEnabled = $true
    offerNotifications = $true
} $global:userToken

if ($prefsResult.success) {
    Write-Success "Preferences updated successfully"
    Write-Info "Preferred Vibes: $($prefsResult.data.preferredVibes -join ', ')"
    Write-Info "Preferred Categories: $($prefsResult.data.preferredCategories -join ', ')"
} else {
    Write-Failure "Preferences update failed: $($prefsResult.error.message)"
}

# Step 3: Discover Venues
Write-TestStep "1.3" "Venue Discovery (List with Filters)"

$venuesResult = Invoke-ApiCall "GET" "/venues?lat=53.4808&lng=-2.2426&maxDistance=5"

if ($venuesResult.success) {
    Write-Success "Venues retrieved: $($venuesResult.data.length) venues found"
    if ($venuesResult.data.length -gt 0) {
        $firstVenue = $venuesResult.data[0]
        Write-Info "Sample Venue: $($firstVenue.name)"
        Write-Info "Category: $($firstVenue.category)"
        Write-Info "Distance: $([math]::Round($firstVenue.distance, 2)) km"
        Write-Info "Busyness: $($firstVenue.liveState.busynessLevel)"
        Write-Info "Vibe: $($firstVenue.liveState.currentVibe)"
        
        $global:testVenueId = $firstVenue.id
    }
} else {
    Write-Failure "Venue discovery failed: $($venuesResult.error.message)"
}

# Step 4: View Venue Details
Write-TestStep "1.4" "View Venue Details"

if ($global:testVenueId) {
    $venueDetailResult = Invoke-ApiCall "GET" "/venues/$global:testVenueId"
    
    if ($venueDetailResult.success) {
        Write-Success "Venue details retrieved"
        Write-Info "Venue: $($venueDetailResult.data.name)"
        Write-Info "Address: $($venueDetailResult.data.address)"
        Write-Info "Price Range: $($venueDetailResult.data.priceRange)"
        Write-Info "Phone: $($venueDetailResult.data.phone)"
        
        if ($venueDetailResult.data.vibeSchedules) {
            Write-Info "Vibe Schedules: $($venueDetailResult.data.vibeSchedules.length) schedules"
        }
    } else {
        Write-Failure "Venue details failed: $($venueDetailResult.error.message)"
    }
}

# Step 5: Track Venue View (Analytics)
Write-TestStep "1.5" "Track Venue View (Analytics)"

if ($global:testVenueId) {
    $trackViewResult = Invoke-ApiCall "POST" "/analytics/venues/$global:testVenueId/track-view" $null $global:userToken
    
    if ($trackViewResult.success) {
        Write-Success "Venue view tracked successfully"
    } else {
        Write-Failure "View tracking failed: $($trackViewResult.error.message)"
    }
}

# Step 6: Browse Offers
Write-TestStep "1.6" "Browse Available Offers"

$offersResult = Invoke-ApiCall "GET" "/offers"

if ($offersResult.success) {
    Write-Success "Offers retrieved: $($offersResult.data.length) offers found"
    
    if ($offersResult.data.length -gt 0) {
        $firstOffer = $offersResult.data[0]
        Write-Info "Sample Offer: $($firstOffer.title)"
        Write-Info "Venue: $($firstOffer.venue.name)"
        Write-Info "Type: $($firstOffer.offerType)"
        $discountSuffix = if ($firstOffer.offerType -eq 'Percentage') { '%' } else { '' }
        Write-Info "Discount: $($firstOffer.discountValue)$discountSuffix"
        Write-Info "Redemptions: $($firstOffer.redemptionCount)"
        
        $global:testOfferId = $firstOffer.id
    }
} else {
    Write-Failure "Offers retrieval failed: $($offersResult.error.message)"
}

# Step 7: Track Offer Impression & Click
Write-TestStep "1.7" "Track Offer Engagement (Impression & Click)"

if ($global:testOfferId) {
    $impressionResult = Invoke-ApiCall "POST" "/analytics/offers/$global:testOfferId/track-impression" $null $global:userToken
    
    if ($impressionResult.success) {
        Write-Success "Offer impression tracked"
    } else {
        Write-Failure "Impression tracking failed: $($impressionResult.error.message)"
    }
    
    Start-Sleep -Milliseconds 500
    
    $clickResult = Invoke-ApiCall "POST" "/analytics/offers/$global:testOfferId/track-click" $null $global:userToken
    
    if ($clickResult.success) {
        Write-Success "Offer click tracked"
    } else {
        Write-Failure "Click tracking failed: $($clickResult.error.message)"
    }
}

# Step 8: Redeem Offer
Write-TestStep "1.8" "Redeem Offer"

if ($global:testOfferId) {
    $redeemResult = Invoke-ApiCall "POST" "/offers/$global:testOfferId/redeem" $null $global:userToken
    
    if ($redeemResult.success) {
        Write-Success "Offer redeemed successfully"
        Write-Info "Redemption ID: $($redeemResult.data.id)"
        Write-Info "Redeemed At: $($redeemResult.data.redeemedAt)"
    } else {
        Write-Failure "Offer redemption failed: $($redeemResult.error.message)"
    }
}

# Step 9: View Notifications
Write-TestStep "1.9" "View User Notifications"

$notificationsResult = Invoke-ApiCall "GET" "/notifications/me" $null $global:userToken

if ($notificationsResult.success) {
    Write-Success "Notifications retrieved"
    Write-Info "Total: $($notificationsResult.data.total)"
    Write-Info "Unread: $($notificationsResult.data.unreadCount)"
    
    if ($notificationsResult.data.notifications.length -gt 0) {
        $global:testNotificationId = $notificationsResult.data.notifications[0].id
    }
} else {
    Write-Failure "Notifications retrieval failed: $($notificationsResult.error.message)"
}

# Step 10: Mark Notification as Read
Write-TestStep "1.10" "Mark Notification as Read"

if ($global:testNotificationId) {
    $markReadResult = Invoke-ApiCall "PATCH" "/notifications/$global:testNotificationId/read" $null $global:userToken
    
    if ($markReadResult.success) {
        Write-Success "Notification marked as read"
    } else {
        Write-Failure "Mark read failed: $($markReadResult.error.message)"
    }
}

# Step 11: View User Profile
Write-TestStep "1.11" "View User Profile"

$profileResult = Invoke-ApiCall "GET" "/users/me" $null $global:userToken

if ($profileResult.success) {
    Write-Success "User profile retrieved"
    Write-Info "Email: $($profileResult.data.email)"
    Write-Info "Role: $($profileResult.data.role)"
    Write-Info "Active: $($profileResult.data.isActive)"
} else {
    Write-Failure "Profile retrieval failed: $($profileResult.error.message)"
}

# Step 12: Test RBAC - User Should NOT Create Venue
Write-TestStep "1.12" "Test RBAC: User Cannot Create Venue"

$unauthorizedVenue = Invoke-ApiCall "POST" "/venues" @{
    name = "Unauthorized Venue"
    category = "Bar"
    cityId = "manchester-id"
} $global:userToken

if (-not $unauthorizedVenue.success -and $unauthorizedVenue.error.statusCode -eq 403) {
    Write-Success "RBAC working: User correctly denied venue creation (403 Forbidden)"
} else {
    Write-Failure "RBAC failed: User should not be able to create venues"
}

# ============================================
# JOURNEY 2: BUSINESS OWNER (BUSINESS ROLE)
# ============================================
Write-TestHeader "JOURNEY 2: Business Owner (BUSINESS Role)"

# Step 1: Business Owner Login
Write-TestStep "2.1" "Business Owner Login"

$businessLoginResult = Invoke-ApiCall "POST" "/auth/login" @{
    email = "owner@test.com"
    password = "password123"
}

if ($businessLoginResult.success) {
    Write-Success "Business owner logged in"
    Write-Info "Email: owner@test.com"
    Write-Info "Role: $($businessLoginResult.data.user.role)"
    
    $global:businessToken = $businessLoginResult.data.access_token
    $global:businessUserId = $businessLoginResult.data.user.id
    
    if ($businessLoginResult.data.user.role -eq "BUSINESS") {
        Write-Success "Business owner has correct role: BUSINESS"
    } else {
        Write-Failure "Business owner role is incorrect: $($businessLoginResult.data.user.role)"
    }
} else {
    Write-Failure "Business login failed: $($businessLoginResult.error.message)"
    Write-Info "Note: Make sure owner@test.com exists with BUSINESS role"
}

# Step 2: View Owner Dashboard Analytics
Write-TestStep "2.2" "View Owner Dashboard Analytics"

if ($global:businessToken) {
    $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    
    $dashboardResult = Invoke-ApiCall "GET" "/analytics/owner/dashboard?startDate=$startDate&endDate=$endDate" $null $global:businessToken
    
    if ($dashboardResult.success) {
        Write-Success "Owner dashboard retrieved"
        Write-Info "Total Views: $($dashboardResult.data.totalViews)"
        Write-Info "Total Offer Clicks: $($dashboardResult.data.totalOfferClicks)"
        Write-Info "Total Redemptions: $($dashboardResult.data.totalRedemptions)"
        if ($dashboardResult.data.estimatedRevenue) {
            Write-Info "Estimated Revenue: £$($dashboardResult.data.estimatedRevenue)"
        }
    } else {
        Write-Failure "Dashboard retrieval failed: $($dashboardResult.error.message)"
    }
}

# Step 3: Get Owned Venues
Write-TestStep "2.3" "Get Business Owner's Venues"

if ($global:businessToken) {
    $ownedVenuesResult = Invoke-ApiCall "GET" "/venues" $null $global:businessToken
    
    if ($ownedVenuesResult.success) {
        Write-Success "Venues retrieved: $($ownedVenuesResult.data.length) venues"
        
        if ($ownedVenuesResult.data.length -gt 0) {
            $ownedVenue = $ownedVenuesResult.data[0]
            Write-Info "Venue: $($ownedVenue.name)"
            Write-Info "Category: $($ownedVenue.category)"
            Write-Info "Current Busyness: $($ownedVenue.liveState.busynessLevel)"
            Write-Info "Current Vibe: $($ownedVenue.liveState.currentVibe)"
            
            $global:businessVenueId = $ownedVenue.id
        }
    } else {
        Write-Failure "Venues retrieval failed: $($ownedVenuesResult.error.message)"
    }
}

# Step 4: Update Venue Busyness
Write-TestStep "2.4" "Update Venue Busyness Level"

if ($global:businessVenueId -and $global:businessToken) {
    $updateBusynessResult = Invoke-ApiCall "PATCH" "/venues/$global:businessVenueId/live-state" @{
        busynessLevel = "Busy"
    } $global:businessToken
    
    if ($updateBusynessResult.success) {
        Write-Success "Busyness updated to: Busy"
        Write-Info "Last Updated: $($updateBusynessResult.data.lastUpdated)"
    } else {
        Write-Failure "Busyness update failed: $($updateBusynessResult.error.message)"
    }
}

# Step 5: Update Venue Vibe
Write-TestStep "2.5" "Update Venue Current Vibe"

if ($global:businessVenueId -and $global:businessToken) {
    $updateVibeResult = Invoke-ApiCall "PATCH" "/venues/$global:businessVenueId/live-state" @{
        currentVibe = "Energetic"
    } $global:businessToken
    
    if ($updateVibeResult.success) {
        Write-Success "Vibe updated to: Energetic"
        Write-Info "Current State - Busyness: $($updateVibeResult.data.busynessLevel), Vibe: $($updateVibeResult.data.currentVibe)"
    } else {
        Write-Failure "Vibe update failed: $($updateVibeResult.error.message)"
    }
}

# Step 6: Create Vibe Schedule
Write-TestStep "2.6" "Create Automated Vibe Schedule"

if ($global:businessVenueId -and $global:businessToken) {
    $createScheduleResult = Invoke-ApiCall "POST" "/venues/$global:businessVenueId/vibe-schedules" @{
        dayOfWeek = 5  # Friday
        startTime = "18:00"
        endTime = "23:00"
        vibeType = "Energetic"
    } $global:businessToken
    
    if ($createScheduleResult.success) {
        Write-Success "Vibe schedule created"
        Write-Info "Day: Friday, Time: 18:00-23:00, Vibe: Energetic"
        $global:vibeScheduleId = $createScheduleResult.data.id
    } else {
        Write-Failure "Vibe schedule creation failed: $($createScheduleResult.error.message)"
    }
}

# Step 7: Create New Offer
Write-TestStep "2.7" "Create New Offer for Venue"

if ($global:businessVenueId -and $global:businessToken) {
    $startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") + "Z"
    $endDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss") + "Z"
    
    $createOfferResult = Invoke-ApiCall "POST" "/offers" @{
        venueId = $global:businessVenueId
        title = "Happy Hour Test - 50% Off"
        description = "Get 50% off all drinks during happy hour"
        offerType = "Percentage"
        discountValue = 50
        startDate = $startDate
        endDate = $endDate
        maxRedemptions = 100
    } $global:businessToken
    
    if ($createOfferResult.success) {
        Write-Success "Offer created successfully"
        Write-Info "Offer ID: $($createOfferResult.data.id)"
        Write-Info "Title: $($createOfferResult.data.title)"
        Write-Info "Status: Active = $($createOfferResult.data.isActive)"
        
        $global:businessOfferId = $createOfferResult.data.id
    } else {
        Write-Failure "Offer creation failed: $($createOfferResult.error.message)"
    }
}

# Step 8: Deactivate Offer
Write-TestStep "2.8" "Deactivate Offer"

if ($global:businessOfferId -and $global:businessToken) {
    $deactivateOfferResult = Invoke-ApiCall "PATCH" "/offers/$global:businessOfferId/status" @{
        isActive = $false
    } $global:businessToken
    
    if ($deactivateOfferResult.success) {
        Write-Success "Offer deactivated"
        Write-Info "Status: Active = $($deactivateOfferResult.data.isActive)"
    } else {
        Write-Failure "Offer deactivation failed: $($deactivateOfferResult.error.message)"
    }
}

# Step 9: View Venue Analytics
Write-TestStep "2.9" "View Venue-Specific Analytics"

if ($global:businessVenueId -and $global:businessToken) {
    $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    
    $venueAnalyticsResult = Invoke-ApiCall "GET" "/analytics/venues/$global:businessVenueId?startDate=$startDate&endDate=$endDate" $null $global:businessToken
    
    if ($venueAnalyticsResult.success) {
        Write-Success "Venue analytics retrieved"
        Write-Info "Venue: $($venueAnalyticsResult.data.venueName)"
        Write-Info "Total Views: $($venueAnalyticsResult.data.totalViews)"
        Write-Info "Unique Visitors: $($venueAnalyticsResult.data.uniqueVisitors)"
        Write-Info "Offer Clicks: $($venueAnalyticsResult.data.offerClicks)"
        Write-Info "Redemptions: $($venueAnalyticsResult.data.redemptions)"
    } else {
        Write-Failure "Venue analytics failed: $($venueAnalyticsResult.error.message)"
    }
}

# Step 10: Test RBAC - Business Owner Should NOT Access Platform Analytics
Write-TestStep "2.10" "Test RBAC: Business Owner Cannot Access Platform Analytics"

if ($global:businessToken) {
    $unauthorizedPlatform = Invoke-ApiCall "GET" "/analytics/platform/engagement" $null $global:businessToken
    
    if (-not $unauthorizedPlatform.success -and $unauthorizedPlatform.error.statusCode -eq 403) {
        Write-Success "RBAC working: Business owner correctly denied platform analytics (403 Forbidden)"
    } else {
        Write-Failure "RBAC failed: Business owner should not access platform analytics"
    }
}

# ============================================
# JOURNEY 3: ADMIN (ADMIN ROLE)
# ============================================
Write-TestHeader "JOURNEY 3: Platform Admin (ADMIN Role)"

# Step 1: Admin Login
Write-TestStep "3.1" "Admin Login"

$adminLoginResult = Invoke-ApiCall "POST" "/auth/login" @{
    email = "admin@reki.com"
    password = "admin123"
}

if ($adminLoginResult.success) {
    Write-Success "Admin logged in"
    Write-Info "Role: $($adminLoginResult.data.user.role)"
    
    $global:adminToken = $adminLoginResult.data.access_token
    
    if ($adminLoginResult.data.user.role -eq "ADMIN") {
        Write-Success "Admin has correct role: ADMIN"
    } else {
        Write-Failure "Admin role is incorrect: $($adminLoginResult.data.user.role)"
    }
} else {
    Write-Failure "Admin login failed: $($adminLoginResult.error.message)"
    Write-Info "Note: You may need to manually create an admin user"
    Write-Info "SQL: UPDATE users SET role = 'ADMIN' WHERE email = 'admin@reki.com';"
}

# Step 2: View Platform-Wide Analytics (ADMIN Only)
Write-TestStep "3.2" "View Platform Engagement Analytics (ADMIN Only)"

if ($global:adminToken) {
    $startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    
    $platformAnalyticsResult = Invoke-ApiCall "GET" "/analytics/platform/engagement?startDate=$startDate&endDate=$endDate" $null $global:adminToken
    
    if ($platformAnalyticsResult.success) {
        Write-Success "Platform analytics retrieved (ADMIN access confirmed)"
        Write-Info "Total Users: $($platformAnalyticsResult.data.totalUsers)"
        Write-Info "Active Users: $($platformAnalyticsResult.data.activeUsers)"
        Write-Info "Total Venues: $($platformAnalyticsResult.data.totalVenues)"
        Write-Info "Total Offers: $($platformAnalyticsResult.data.totalOffers)"
        Write-Info "Total Redemptions: $($platformAnalyticsResult.data.totalRedemptions)"
        if ($platformAnalyticsResult.data.platformRevenue) {
            Write-Info "Platform Revenue: £$($platformAnalyticsResult.data.platformRevenue)"
        }
    } else {
        Write-Failure "Platform analytics failed: $($platformAnalyticsResult.error.message)"
    }
}

# Step 3: Admin Override - Update Any Venue (Ownership Override)
Write-TestStep "3.3" "Test Admin Override: Update Any Venue Without Ownership"

if ($global:adminToken -and $global:testVenueId) {
    $adminOverrideResult = Invoke-ApiCall "PATCH" "/venues/$global:testVenueId/live-state" @{
        busynessLevel = "Quiet"
        currentVibe = "Chill"
    } $global:adminToken
    
    if ($adminOverrideResult.success) {
        Write-Success "Admin successfully updated venue without ownership (Override confirmed)"
        Write-Info "Updated to: Quiet / Chill"
    } else {
        Write-Failure "Admin override failed: $($adminOverrideResult.error.message)"
    }
}

# Step 4: Admin Override - Manage Any Offer
Write-TestStep "3.4" "Test Admin Override: Manage Any Offer Without Ownership"

if ($global:adminToken -and $global:testOfferId) {
    $adminOfferResult = Invoke-ApiCall "PATCH" "/offers/$global:testOfferId/status" @{
        isActive = $true
    } $global:adminToken
    
    if ($adminOfferResult.success) {
        Write-Success "Admin successfully managed offer without ownership (Override confirmed)"
    } else {
        Write-Failure "Admin offer override failed: $($adminOfferResult.error.message)"
    }
}

# ============================================
# FINAL SUMMARY
# ============================================
Write-TestHeader "Test Results Summary"

Write-Host "Total Tests Passed: " -NoNewline
Write-Host $global:testResults.passed -ForegroundColor Green

Write-Host "Total Tests Failed: " -NoNewline
Write-Host $global:testResults.failed -ForegroundColor $(if ($global:testResults.failed -gt 0) { "Red" } else { "Green" })

if ($global:testResults.failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    foreach ($error in $global:testResults.errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
}

$successRate = [math]::Round(($global:testResults.passed / ($global:testResults.passed + $global:testResults.failed)) * 100, 2)
Write-Host "`nSuccess Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

if ($successRate -eq 100) {
    Write-Host "`n🎉 ALL JOURNEYS COMPLETED SUCCESSFULLY! 🎉" -ForegroundColor Green
    Write-Host "The REKI MVP backend is fully functional and ready for iOS integration!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "`n⚠️  Most journeys working - minor issues detected" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Critical issues detected - please review errors above" -ForegroundColor Red
}

Write-Host ""
