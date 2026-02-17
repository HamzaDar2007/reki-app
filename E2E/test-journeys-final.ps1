# REKI User Journeys Test Suite
$baseUrl = "http://localhost:3000"
$passed = 0; $failed = 0

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "  REKI USER JOURNEYS TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check server
Write-Host "[PRE] Checking server..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/" -TimeoutSec 5 | Out-Null
    Write-Host "  [OK] Server is running" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  [FAIL] Server not running" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOURNEY 1: Regular User" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Register
Write-Host "[1.1] User Registration..." -ForegroundColor Yellow
$userEmail = "testuser_$(Get-Random)@example.com"
try {
    $register = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body (@{email=$userEmail;password="TestPass123!"} | ConvertTo-Json)
    Write-Host "  [OK] User registered: $userEmail, Role: $($register.user.role)" -ForegroundColor Green
    $global:userToken = $register.access_token
    $passed++
} catch {
    Write-Host "  [FAIL] Registration failed" -ForegroundColor Red
    $failed++
}

# Set Preferences
if ($global:userToken) {
    Write-Host "[1.2] Setting preferences..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:userToken)" }
        $prefs = Invoke-RestMethod -Uri "$baseUrl/users/me/preferences" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{preferredVibes=@("Energetic","Social");preferredCategories=@("Bar");minBusyness="Moderate"} | ConvertTo-Json)
        Write-Host "  [OK] Preferences set" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Preferences failed" -ForegroundColor Red
        $failed++
    }
}

# Discover Venues
Write-Host "[1.3] Discovering venues..." -ForegroundColor Yellow
try {
    $venues = Invoke-RestMethod -Uri "$baseUrl/venues?lat=53.4808``&lng=-2.2426``&maxDistance=10"
    Write-Host "  [OK] Found $($venues.length) venues" -ForegroundColor Green
    if ($venues.length -gt 0) {
        $global:venueId = $venues[0].id
        Write-Host "  [INFO] Sample: $($venues[0].name)" -ForegroundColor Cyan
    }
    $passed++
} catch {
    Write-Host "  [FAIL] Venue discovery failed" -ForegroundColor Red
    $failed++
}

# View Venue Details
if ($global:venueId) {
    Write-Host "[1.4] Viewing venue details..." -ForegroundColor Yellow
    try {
        $detail = Invoke-RestMethod -Uri "$baseUrl/venues/$($global:venueId)"
        Write-Host "  [OK] Venue details loaded: $($detail.name)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Venue details failed" -ForegroundColor Red
        $failed++
    }
}

# Track View
if ($global:venueId -and $global:userToken) {
    Write-Host "[1.5] Tracking venue view..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:userToken)" }
        Invoke-RestMethod -Uri "$baseUrl/analytics/venues/$($global:venueId)/track-view" -Method POST -Headers $headers | Out-Null
        Write-Host "  [OK] View tracked" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] View tracking failed" -ForegroundColor Red
        $failed++
    }
}

# Browse Offers
Write-Host "[1.6] Browsing offers..." -ForegroundColor Yellow
try {
    $offers = Invoke-RestMethod -Uri "$baseUrl/offers"
    Write-Host "  [OK] Found $($offers.length) offers" -ForegroundColor Green
    if ($offers.length -gt 0) {
        $global:offerId = $offers[0].id
        Write-Host "  [INFO] Sample: $($offers[0].title)" -ForegroundColor Cyan
    }
    $passed++
} catch {
    Write-Host "  [FAIL] Offers browse failed" -ForegroundColor Red
    $failed++
}

# Track Offer Engagement & Redeem
if ($global:offerId -and $global:userToken) {
    Write-Host "[1.7] Tracking offer & redeeming..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:userToken)" }
        Invoke-RestMethod -Uri "$baseUrl/analytics/offers/$($global:offerId)/track-impression" -Method POST -Headers $headers | Out-Null
        Invoke-RestMethod -Uri "$baseUrl/analytics/offers/$($global:offerId)/track-click" -Method POST -Headers $headers | Out-Null
        $redemption = Invoke-RestMethod -Uri "$baseUrl/offers/$($global:offerId)/redeem" -Method POST -Headers $headers
        Write-Host "  [OK] Engagement tracked & offer redeemed" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Engagement/redemption failed" -ForegroundColor Red
        $failed++
    }
}

# View Notifications & Profile
if ($global:userToken) {
    Write-Host "[1.8] Viewing notifications & profile..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:userToken)" }
        $notifications = Invoke-RestMethod -Uri "$baseUrl/notifications/me" -Headers $headers
        $profile = Invoke-RestMethod -Uri "$baseUrl/users/me" -Headers $headers
        Write-Host "  [OK] Notifications: $($notifications.total), Profile: $($profile.email)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Notifications/profile failed" -ForegroundColor Red
        $failed++
    }
}

# Test RBAC - User Cannot Create Venue
if ($global:userToken) {
    Write-Host "[1.9] Testing RBAC: User cannot create venue..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:userToken)" }
        Invoke-RestMethod -Uri "$baseUrl/venues" -Method POST -Headers $headers -ContentType "application/json" -Body (@{name="Test";category="Bar"} | ConvertToJSON) -ErrorAction Stop
        Write-Host "  [FAIL] RBAC broken: User should not create venues" -ForegroundColor Red
        $failed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "  [OK] RBAC working: User denied (403)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  [FAIL] Wrong error code" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOURNEY 2: Business Owner" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Business Login
Write-Host "[2.1] Business login..." -ForegroundColor Yellow
try {
    $business = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{email="owner@test.com";password="password123"} | ConvertTo-Json)
    Write-Host "  [OK] Business logged in, Role: $($business.user.role)" -ForegroundColor Green
    $global:businessToken = $business.access_token
    $passed++
} catch {
    Write-Host "  [FAIL] Business login failed" -ForegroundColor Red
    $failed++
}

# Dashboard & Owned Venues
if ($global:businessToken) {
    Write-Host "[2.2] Viewing dashboard & owned venues..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:businessToken)" }
        $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
        $endDate = (Get-Date).ToString("yyyy-MM-dd")
        $dashboard = Invoke-RestMethod -Uri "$baseUrl/analytics/owner/dashboard?startDate=$startDate``&endDate=$endDate" -Headers $headers
        $ownedVenues = Invoke-RestMethod -Uri "$baseUrl/venues" -Headers $headers
        Write-Host "  [OK] Dashboard loaded, $($ownedVenues.length) venues owned" -ForegroundColor Green
        if ($ownedVenues.length -gt 0) {
            $global:bizVenueId = $ownedVenues[0].id
            Write-Host "  [INFO] Venue: $($ownedVenues[0].name)" -ForegroundColor Cyan
        }
        $passed++
    } catch {
        Write-Host "  [FAIL] Dashboard/venues failed" -ForegroundColor Red
        $failed++
    }
}

# Update Busyness & Vibe
if ($global:bizVenueId -and $global:businessToken) {
    Write-Host "[2.3] Updating busyness & vibe..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:businessToken)" }
        Invoke-RestMethod -Uri "$baseUrl/venues/$($global:bizVenueId)/live-state" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{busynessLevel="Busy";currentVibe="Energetic"} | ConvertTo-Json) | Out-Null
        Write-Host "  [OK] Busyness & vibe updated" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Update failed" -ForegroundColor Red
        $failed++
    }
}

# Create Vibe Schedule
if ($global:bizVenueId -and $global:businessToken) {
    Write-Host "[2.4] Creating vibe schedule..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:businessToken)" }
        Invoke-RestMethod -Uri "$baseUrl/venues/$($global:bizVenueId)/vibe-schedules" -Method POST -Headers $headers -ContentType "application/json" -Body (@{dayOfWeek=5;startTime="18:00";endTime="23:00";vibeType="Energetic"} | ConvertTo-Json) | Out-Null
        Write-Host "  [OK] Vibe schedule created" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Schedule creation failed" -ForegroundColor Red
        $failed++
    }
}

# Create & Manage Offer
if ($global:bizVenueId -and $global:businessToken) {
    Write-Host "[2.5] Creating & managing offer..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:businessToken)" }
        $startDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        $endDate = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
        $offer = Invoke-RestMethod -Uri "$baseUrl/offers" -Method POST -Headers $headers -ContentType "application/json" -Body (@{venueId=$global:bizVenueId;title="Test 50% Off";description="Test";offerType="Percentage";discountValue=50;startDate=$startDate;endDate=$endDate;maxRedemptions=100} | ConvertTo-Json)
        Invoke-RestMethod -Uri "$baseUrl/offers/$($offer.id)/status" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{isActive=$false} | ConvertTo-Json) | Out-Null
        Write-Host "  [OK] Offer created & deactivated" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Offer management failed" -ForegroundColor Red
        $failed++
    }
}

# View Analytics
if ($global:bizVenueId -and $global:businessToken) {
    Write-Host "[2.6] Viewing venue analytics..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:businessToken)" }
        $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
        $endDate = (Get-Date).ToString("yyyy-MM-dd")
        $analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/venues/$($global:bizVenueId)?startDate=$startDate``&endDate=$endDate" -Headers $headers
        Write-Host "  [OK] Analytics: $($analytics.totalViews) views, $($analytics.uniqueVisitors) visitors" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Analytics failed" -ForegroundColor Red
        $failed++
    }
}

# Test RBAC - Business Cannot Access Platform Analytics
if ($global:businessToken) {
    Write-Host "[2.7] Testing RBAC: Business cannot access platform analytics..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:businessToken)" }
        Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement" -Headers $headers -ErrorAction Stop
        Write-Host "  [FAIL] RBAC broken: Business should not access platform analytics" -ForegroundColor Red
        $failed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "  [OK] RBAC working: Business denied (403)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  [FAIL] Wrong error code" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  JOURNEY 3: Platform Admin" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Admin Login
Write-Host "[3.1] Admin login..." -ForegroundColor Yellow
try {
    $admin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body (@{email="admin@reki.com";password="admin123"} | ConvertTo-Json)
    Write-Host "  [OK] Admin logged in, Role: $($admin.user.role)" -ForegroundColor Green
    $global:adminToken = $admin.access_token
    $passed++
} catch {
    Write-Host "  [FAIL] Admin login failed - may need to create admin user" -ForegroundColor Red
    $failed++
}

# Platform Analytics
if ($global:adminToken) {
    Write-Host "[3.2] Viewing platform analytics (ADMIN only)..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:adminToken)" }
        $startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
        $endDate = (Get-Date).ToString("yyyy-MM-dd")
        $platformAnalytics = Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement?startDate=$startDate``&endDate=$endDate" -Headers $headers
        Write-Host "  [OK] Platform analytics: $($platformAnalytics.totalUsers) users, $($platformAnalytics.totalVenues) venues" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Platform analytics failed" -ForegroundColor Red
        $failed++
    }
}

# Admin Overrides
if ($global:adminToken -and $global:venueId) {
    Write-Host "[3.3] Testing admin overrides..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $($global:adminToken)" }
        Invoke-RestMethod -Uri "$baseUrl/venues/$($global:venueId)/live-state" -Method PATCH -Headers $headers -ContentType "application/json" -Body (@{busynessLevel="Quiet";currentVibe="Chill"} | ConvertTo-Json) | Out-Null
        Write-Host "  [OK] Admin successfully overrode venue ownership" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  [FAIL] Admin override failed" -ForegroundColor Red
        $failed++
    }
}

# Summary
$total = $passed + $failed
$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Tests Passed: $passed" -ForegroundColor Green
Write-Host "Tests Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })

if ($successRate -eq 100) {
    Write-Host "`nALL JOURNEYS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "The REKI MVP backend is fully functional!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "`nMost journeys working - minor issues" -ForegroundColor Yellow
} else {
    Write-Host "`nCritical issues detected" -ForegroundColor Red
}
