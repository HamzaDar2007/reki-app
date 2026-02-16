# Test Analytics Dashboard Features
$baseUrl = "http://localhost:3000"
$cityId = "3ff5e526-7819-45d5-9995-bd6db919c9b2" # Manchester

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING ANALYTICS DASHBOARD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# First, login as venue owner to get token
Write-Host "0. Logging in as test venue owner..." -ForegroundColor Yellow
try {
    # Try existing user first
    $loginBody = @{
        email = "owner@test.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResult = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResult.access_token
    $headers = @{ Authorization = "Bearer $token" }
    Write-Host "Success: Logged in as owner@test.com" -ForegroundColor Green
} catch {
    Write-Host "Creating new venue owner account..." -ForegroundColor Yellow
    try {
        # Register new owner
        $registerBody = @{
            email = "owner@test.com"
            password = "password123"
        } | ConvertTo-Json
        
        $registerResult = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
        $token = $registerResult.access_token
        $headers = @{ Authorization = "Bearer $token" }
        Write-Host "Success: Created and logged in as owner@test.com" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create/login: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Create a test venue if needed
Write-Host "1. Creating test venue for analytics..." -ForegroundColor Yellow
try {
    $venueBody = @{
        cityId = $cityId
        name = "Analytics Test Venue $(Get-Random)"
        category = "BAR"
        address = "123 Test Street"
        postcode = "M1 1AA"
        description = "Test venue for analytics"
    } | ConvertTo-Json
    
    $venue = Invoke-RestMethod -Uri "$baseUrl/venues" -Method POST -Body $venueBody -ContentType "application/json" -Headers $headers
    $venueId = $venue.id
    Write-Host "Success: Created venue '$($venue.name)'" -ForegroundColor Green
    Write-Host "  Venue ID: $venueId" -ForegroundColor Gray
} catch {
    Write-Host "Failed to create venue: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Using first venue from list instead..." -ForegroundColor Yellow
    $venues = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId" -Method GET
    $venueId = $venues[0].id
    Write-Host "  Using venue: $($venues[0].name) ($venueId)" -ForegroundColor Gray
}
Write-Host ""

# Create test offers for the venue
Write-Host "2. Creating test offers..." -ForegroundColor Yellow
try {
    $offerBody = @{
        venueId = $venueId
        title = "Test Happy Hour"
        description = "2-for-1 drinks"
        offerType = "DISCOUNT"
        minBusyness = "QUIET"
        startsAt = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endsAt = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    $offer1 = Invoke-RestMethod -Uri "$baseUrl/offers" -Method POST -Body $offerBody -ContentType "application/json" -Headers $headers
    Write-Host "Success: Created offer '$($offer1.title)'" -ForegroundColor Green
    
    # Simulate some analytics data
    Invoke-RestMethod -Uri "$baseUrl/offers/$($offer1.id)/view" -Method PATCH -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/offers/$($offer1.id)/view" -Method PATCH -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/offers/$($offer1.id)/click" -Method PATCH -Headers $headers | Out-Null
    Write-Host "  Simulated: 2 views, 1 click" -ForegroundColor Gray
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 1: Owner Dashboard
Write-Host "3. GET /analytics/owner/dashboard - Owner overview" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/analytics/owner/dashboard" -Method GET -Headers $headers
    Write-Host "Success: Retrieved owner dashboard" -ForegroundColor Green
    Write-Host "  Total venues: $($result.summary.totalVenues)" -ForegroundColor Gray
    Write-Host "  Total offers: $($result.summary.totalOffers)" -ForegroundColor Gray
    Write-Host "  Total views: $($result.summary.totalViews)" -ForegroundColor Gray
    Write-Host "  Total redemptions: $($result.summary.totalRedemptions)" -ForegroundColor Gray
    Write-Host "  Overall conversion: $($result.summary.overallConversionRate)%" -ForegroundColor Gray
    if ($result.venues.Count -gt 0) {
        Write-Host "  First venue: $($result.venues[0].name) - $($result.venues[0].totalOffers) offers" -ForegroundColor Gray
    }
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Venue Analytics
Write-Host "4. GET /analytics/venues/:id - Detailed venue analytics" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/analytics/venues/$venueId" -Method GET -Headers $headers
    Write-Host "Success: Retrieved venue analytics" -ForegroundColor Green
    Write-Host "  Venue: $($result.venue.name) ($($result.venue.category))" -ForegroundColor Gray
    Write-Host "  Offers - Total: $($result.offers.total), Active: $($result.offers.active), Expired: $($result.offers.expired)" -ForegroundColor Gray
    Write-Host "  Performance:" -ForegroundColor Gray
    Write-Host "    - Views: $($result.performance.totalViews)" -ForegroundColor Gray
    Write-Host "    - Clicks: $($result.performance.totalClicks)" -ForegroundColor Gray
    Write-Host "    - Redemptions: $($result.performance.totalRedemptions)" -ForegroundColor Gray
    Write-Host "    - Conversion Rate: $($result.performance.overallConversionRate)%" -ForegroundColor Gray
    if ($result.topOffers.Count -gt 0) {
        Write-Host "  Top offer: $($result.topOffers[0].title) - $($result.topOffers[0].views) views" -ForegroundColor Gray
    }
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Venue Analytics with Date Range
Write-Host "5. GET /analytics/venues/:id?startDate&endDate - Date filtered" -ForegroundColor Yellow
try {
    $startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $result = Invoke-RestMethod -Uri "$baseUrl/analytics/venues/$venueId`?startDate=$startDate&endDate=$endDate" -Method GET -Headers $headers
    Write-Host "Success: Retrieved filtered analytics (last 7 days)" -ForegroundColor Green
    Write-Host "  Offers in range: $($result.offers.total)" -ForegroundColor Gray
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Offer Analytics
Write-Host "6. GET /analytics/offers/:id - Individual offer analytics" -ForegroundColor Yellow
try {
    if ($offer1) {
        $result = Invoke-RestMethod -Uri "$baseUrl/analytics/offers/$($offer1.id)" -Method GET -Headers $headers
        Write-Host "Success: Retrieved offer analytics" -ForegroundColor Green
        Write-Host "  Offer: $($result.offer.title)" -ForegroundColor Gray
        Write-Host "  Status: $(if ($result.offer.isActive) {'Active'} else {'Inactive'})" -ForegroundColor Gray
        Write-Host "  Metrics:" -ForegroundColor Gray
        Write-Host "    - Views: $($result.metrics.views)" -ForegroundColor Gray
        Write-Host "    - Clicks: $($result.metrics.clicks)" -ForegroundColor Gray
        Write-Host "    - Redemptions: $($result.metrics.redemptions)" -ForegroundColor Gray
        Write-Host "    - Click-Through Rate: $($result.metrics.clickThroughRate)%" -ForegroundColor Gray
        Write-Host "    - Conversion Rate: $($result.metrics.conversionRate)%" -ForegroundColor Gray
    }
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Platform Engagement
Write-Host "7. GET /analytics/platform/engagement - Platform-wide metrics" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement" -Method GET -Headers $headers
    Write-Host "Success: Retrieved platform engagement metrics" -ForegroundColor Green
    Write-Host "  Notifications:" -ForegroundColor Gray
    Write-Host "    - Total sent: $($result.notifications.totalSent)" -ForegroundColor Gray
    Write-Host "    - Total read: $($result.notifications.totalRead)" -ForegroundColor Gray
    Write-Host "    - Read rate: $($result.notifications.readRate)%" -ForegroundColor Gray
    Write-Host "  Offers:" -ForegroundColor Gray
    Write-Host "    - Total offers: $($result.offers.totalOffers)" -ForegroundColor Gray
    Write-Host "    - Total views: $($result.offers.totalViews)" -ForegroundColor Gray
    Write-Host "    - Total redemptions: $($result.offers.totalRedemptions)" -ForegroundColor Gray
    Write-Host "    - Avg conversion: $($result.offers.averageConversionRate)%" -ForegroundColor Gray
    Write-Host "  Venues:" -ForegroundColor Gray
    Write-Host "    - Total: $($result.venues.totalVenues)" -ForegroundColor Gray
    Write-Host "    - Active: $($result.venues.activeVenues)" -ForegroundColor Gray
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Test ownership enforcement
Write-Host "8. Testing ownership enforcement..." -ForegroundColor Yellow
try {
    # Get another venue not owned by current user
    $allVenues = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId" -Method GET
    $otherVenue = $allVenues | Where-Object { $_.id -ne $venueId } | Select-Object -First 1
    
    if ($otherVenue) {
        try {
            $result = Invoke-RestMethod -Uri "$baseUrl/analytics/venues/$($otherVenue.id)" -Method GET -Headers $headers
            Write-Host "Warning: Should have blocked access to non-owned venue" -ForegroundColor Yellow
        } catch {
            if ($_.Exception.Message -like "*403*" -or $_.Exception.Message -like "*Forbidden*") {
                Write-Host "Success: Correctly blocked access to non-owned venue" -ForegroundColor Green
            } else {
                Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Skipped: No other venues available for testing" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Test error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANALYTICS DASHBOARD TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary of Features Tested:" -ForegroundColor Green
Write-Host "✓ Owner dashboard with all venues summary" -ForegroundColor Green
Write-Host "✓ Detailed venue analytics" -ForegroundColor Green
Write-Host "✓ Date-filtered venue analytics" -ForegroundColor Green
Write-Host "✓ Individual offer analytics with metrics" -ForegroundColor Green
Write-Host "✓ Platform-wide engagement analytics" -ForegroundColor Green
Write-Host "✓ Ownership verification & access control" -ForegroundColor Green
