# ===========================================================================
# REKI APP - KEY METRICS DEMO SCRIPT
# ===========================================================================
# Purpose: Demonstrate analytics and key business metrics for investors
# Duration: ~2-3 minutes
# ===========================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"

Write-Host "`n======= REKI KEY METRICS DEMO =======" -ForegroundColor Cyan
Write-Host "Demonstrating platform analytics and business value`n"

# Register test user for authenticated analytics
Write-Host ">> Initializing Analytics Session..." -ForegroundColor Yellow
$email = "metrics.user$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$registerBody = @{ email = $email; password = "password123" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$token = $auth.accessToken
$headers = @{ Authorization = "Bearer $token" }
Write-Host "[OK] Analytics session initialized`n" -ForegroundColor Green
Start-Sleep -Seconds 1

# Step 1: Platform Engagement Metrics
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host "  STEP 1: PLATFORM ENGAGEMENT METRICS" -ForegroundColor Magenta
Write-Host "=======================================================================" -ForegroundColor Magenta
try {
    $engagement = Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement" -Headers $headers
    Write-Host ""
    Write-Host "  Platform Overview:" -ForegroundColor Cyan
    Write-Host "    Total Users:          $($engagement.totalUsers)" -ForegroundColor White
    Write-Host "    Total Venues:         $($engagement.totalVenues)" -ForegroundColor White
    Write-Host "    Total Offers:         $($engagement.totalOffers)" -ForegroundColor White
    Write-Host "    Active Offers:        $($engagement.activeOffers)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  User Engagement:" -ForegroundColor Cyan
    Write-Host "    Total Offer Views:    $($engagement.totalOfferViews)" -ForegroundColor White
    Write-Host "    Total Redemptions:    $($engagement.totalRedemptions)" -ForegroundColor White
    
    if ($engagement.totalOfferViews -gt 0) {
        $conversionRate = [math]::Round(($engagement.totalRedemptions / $engagement.totalOfferViews) * 100, 2)
        Write-Host "    Conversion Rate:      $conversionRate%" -ForegroundColor Yellow
    } else {
        Write-Host "    Conversion Rate:      N/A (no views yet)" -ForegroundColor Gray
    }
    
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "  [INFO] Platform metrics endpoint requires permissions" -ForegroundColor Yellow
    Write-Host "  Showing alternative metrics from venue data..." -ForegroundColor Gray
    Write-Host ""
}
Start-Sleep -Seconds 2

# Step 2: Venue Distribution
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host "  STEP 2: VENUE DISTRIBUTION" -ForegroundColor Magenta
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host ""
$allVenues = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$manchesterId"

# Count by category
$barCount = ($allVenues | Where-Object { $_.category -eq "BAR" }).Count
$clubCount = ($allVenues | Where-Object { $_.category -eq "CLUB" }).Count
$restaurantCount = ($allVenues | Where-Object { $_.category -eq "RESTAURANT" }).Count

Write-Host "  By Category:" -ForegroundColor Cyan
Write-Host "    BARS:           $barCount venues" -ForegroundColor White
Write-Host "    CLUBS:          $clubCount venues" -ForegroundColor White
Write-Host "    RESTAURANTS:    $restaurantCount venues" -ForegroundColor White
Write-Host "    TOTAL:          $($allVenues.Count) venues" -ForegroundColor Green
Write-Host ""

# Count by busyness
$busyVenues = ($allVenues | Where-Object { $_.currentBusyness -eq "BUSY" }).Count
$moderateVenues = ($allVenues | Where-Object { $_.currentBusyness -eq "MODERATE" }).Count
$quietVenues = ($allVenues | Where-Object { $_.currentBusyness -eq "QUIET" }).Count

Write-Host "  By Busyness Level:" -ForegroundColor Cyan
Write-Host "    BUSY:           $busyVenues venues" -ForegroundColor Red
Write-Host "    MODERATE:       $moderateVenues venues" -ForegroundColor Yellow
Write-Host "    QUIET:          $quietVenues venues" -ForegroundColor Green
Write-Host ""

# Count by vibe
$partyVibe = ($allVenues | Where-Object { $_.currentVibe -eq "PARTY" }).Count
$chillVibe = ($allVenues | Where-Object { $_.currentVibe -eq "CHILL" }).Count
$liveMusicVibe = ($allVenues | Where-Object { $_.currentVibe -eq "LIVE_MUSIC" }).Count
$sportsVibe = ($allVenues | Where-Object { $_.currentVibe -eq "SPORTS" }).Count

Write-Host "  By Vibe:" -ForegroundColor Cyan
Write-Host "    PARTY:          $partyVibe venues" -ForegroundColor Magenta
Write-Host "    CHILL:          $chillVibe venues" -ForegroundColor Cyan
Write-Host "    LIVE_MUSIC:     $liveMusicVibe venues" -ForegroundColor Yellow
Write-Host "    SPORTS:         $sportsVibe venues" -ForegroundColor Blue
Write-Host ""
Start-Sleep -Seconds 3

# Step 3: Offer Performance
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host "  STEP 3: OFFER PERFORMANCE METRICS" -ForegroundColor Magenta
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host ""

# Get a test venue and its offers
$testVenue = $allVenues | Select-Object -First 1
try {
    $venueOffers = Invoke-RestMethod -Uri "$baseUrl/offers?venueId=$($testVenue.id)"
} catch {
    $venueOffers = @()
}

Write-Host "  Sample Venue: $($testVenue.name)" -ForegroundColor Cyan
Write-Host "  Total Offers: $($venueOffers.Count)" -ForegroundColor White
Write-Host ""

if ($venueOffers.Count -gt 0) {
    Write-Host "  Top Performing Offers:" -ForegroundColor Cyan
    $venueOffers | Sort-Object -Property redeemCount -Descending | Select-Object -First 3 | ForEach-Object {
        Write-Host "    * $($_.title)" -ForegroundColor White
        Write-Host "      Type:        $($_.offerType)" -ForegroundColor Gray
        Write-Host "      Views:       $($_.viewCount)" -ForegroundColor Gray
        Write-Host "      Clicks:      $($_.clickCount)" -ForegroundColor Gray
        Write-Host "      Redemptions: $($_.redeemCount)" -ForegroundColor Gray
        
        if ($_.viewCount -gt 0) {
            $ctr = [math]::Round(($_.clickCount / $_.viewCount) * 100, 2)
            $conversion = [math]::Round(($_.redeemCount / $_.viewCount) * 100, 2)
            Write-Host "      CTR:         $ctr%" -ForegroundColor Yellow
            Write-Host "      Conversion:  $conversion%" -ForegroundColor Green
        }
        Write-Host ""
    }
} else {
    Write-Host "  No offers available for this venue" -ForegroundColor Gray
    Write-Host ""
}
Start-Sleep -Seconds 3

# Step 4: Owner Dashboard Summary
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host "  STEP 4: VENUE OWNER DASHBOARD" -ForegroundColor Magenta
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host ""
try {
    $ownerDashboard = Invoke-RestMethod -Uri "$baseUrl/analytics/owner/dashboard" -Headers $headers
    Write-Host "  Owner Metrics:" -ForegroundColor Cyan
    Write-Host "    Managed Venues:     $($ownerDashboard.totalVenues)" -ForegroundColor White
    Write-Host "    Active Offers:      $($ownerDashboard.totalOffers)" -ForegroundColor White
    Write-Host "    Total Views:        $($ownerDashboard.totalViews)" -ForegroundColor White
    Write-Host "    Total Clicks:       $($ownerDashboard.totalClicks)" -ForegroundColor White
    Write-Host "    Total Redemptions:  $($ownerDashboard.totalRedemptions)" -ForegroundColor White
    Write-Host ""
    
    if ($ownerDashboard.totalViews -gt 0) {
        $ownerCTR = [math]::Round(($ownerDashboard.totalClicks / $ownerDashboard.totalViews) * 100, 2)
        $ownerConversion = [math]::Round(($ownerDashboard.totalRedemptions / $ownerDashboard.totalViews) * 100, 2)
        Write-Host "  Performance:" -ForegroundColor Cyan
        Write-Host "    Click-Through Rate:  $ownerCTR%" -ForegroundColor Yellow
        Write-Host "    Conversion Rate:     $ownerConversion%" -ForegroundColor Green
        Write-Host ""
    }
} catch {
    Write-Host "[INFO] Owner dashboard requires venue ownership" -ForegroundColor Yellow
    Write-Host ""
}
Start-Sleep -Seconds 3

# Step 5: Market Insights
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host "  STEP 5: MARKET INSIGHTS" -ForegroundColor Magenta
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "  Manchester Nightlife Analysis:" -ForegroundColor Cyan
Write-Host "    Total Venues:        $($allVenues.Count)" -ForegroundColor White
Write-Host "    Market Coverage:     100% (Manchester focus)" -ForegroundColor White
Write-Host ""

# Calculate venue density
$avgVenuesPerCategory = [math]::Round($allVenues.Count / 3, 2)
Write-Host "  Category Distribution:" -ForegroundColor Cyan
Write-Host "    Bars:                $barCount ($([math]::Round(($barCount/$allVenues.Count)*100,1))%)" -ForegroundColor White
Write-Host "    Clubs:               $clubCount ($([math]::Round(($clubCount/$allVenues.Count)*100,1))%)" -ForegroundColor White
Write-Host "    Restaurants:         $restaurantCount ($([math]::Round(($restaurantCount/$allVenues.Count)*100,1))%)" -ForegroundColor White
Write-Host ""

# Vibe distribution
Write-Host "  Current Atmosphere:" -ForegroundColor Cyan
$totalWithVibe = $partyVibe + $chillVibe + $liveMusicVibe + $sportsVibe
if ($totalWithVibe -gt 0) {
    Write-Host "    Party:               $partyVibe ($([math]::Round(($partyVibe/$allVenues.Count)*100,1))%)" -ForegroundColor Magenta
    Write-Host "    Chill:               $chillVibe ($([math]::Round(($chillVibe/$allVenues.Count)*100,1))%)" -ForegroundColor Cyan
    Write-Host "    Live Music:          $liveMusicVibe ($([math]::Round(($liveMusicVibe/$allVenues.Count)*100,1))%)" -ForegroundColor Yellow
    Write-Host "    Sports:              $sportsVibe ($([math]::Round(($sportsVibe/$allVenues.Count)*100,1))%)" -ForegroundColor Blue
} else {
    Write-Host "    Vibes distribution not yet established" -ForegroundColor Gray
}
Write-Host ""
Start-Sleep -Seconds 3

# Step 6: Business Value Summary
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host "  STEP 6: BUSINESS VALUE SUMMARY" -ForegroundColor Magenta
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "  Revenue Opportunities:" -ForegroundColor Cyan
Write-Host "    * Venue Listings:     $($allVenues.Count) x subscription fee" -ForegroundColor White
Write-Host "    * Offer Promotions:   Premium placement revenue" -ForegroundColor White
Write-Host "    * Analytics Package:  Data insights for owners" -ForegroundColor White
Write-Host "    * Commission Model:   % of redemptions" -ForegroundColor White
Write-Host ""

Write-Host "  Growth Potential:" -ForegroundColor Cyan
Write-Host "    * Venues:             Scalable to 100+ venues" -ForegroundColor White
Write-Host "    * Cities:             Expandable to 10+ cities" -ForegroundColor White
Write-Host "    * Users:              Targeting 10,000+ users/city" -ForegroundColor White
Write-Host "    * Partnerships:       Integration with booking platforms" -ForegroundColor White
Write-Host ""

Write-Host "  Competitive Advantages:" -ForegroundColor Cyan
Write-Host "    * Real-time busyness and vibe data" -ForegroundColor Green
Write-Host "    * Dynamic offer management" -ForegroundColor Green
Write-Host "    * Automated venue state updates" -ForegroundColor Green
Write-Host "    * Comprehensive analytics dashboard" -ForegroundColor Green
Write-Host "    * Smart filtering and recommendations" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# Final Summary
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host "  KEY METRICS SUMMARY" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host ""

try {
    $finalEngagement = Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement" -Headers $headers
    
    Write-Host "  Platform Scale:" -ForegroundColor Cyan
    Write-Host "    Users:              $($finalEngagement.totalUsers)" -ForegroundColor White
    Write-Host "    Venues:             $($finalEngagement.totalVenues)" -ForegroundColor White
    Write-Host "    Active Offers:      $($finalEngagement.activeOffers)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  Engagement Metrics:" -ForegroundColor Cyan
    Write-Host "    Total Views:        $($finalEngagement.totalOfferViews)" -ForegroundColor White
    Write-Host "    Total Redemptions:  $($finalEngagement.totalRedemptions)" -ForegroundColor White
    
    if ($finalEngagement.totalOfferViews -gt 0) {
        $finalConversion = [math]::Round(($finalEngagement.totalRedemptions / $finalEngagement.totalOfferViews) * 100, 2)
        Write-Host "    Conversion Rate:    $finalConversion%" -ForegroundColor Yellow
    }
    Write-Host ""
    
    Write-Host "  Market Position:" -ForegroundColor Cyan
    Write-Host "    Coverage:           Manchester (Pilot City)" -ForegroundColor White
    Write-Host "    Venue Mix:          $barCount Bars, $clubCount Clubs, $restaurantCount Restaurants" -ForegroundColor White
    Write-Host "    Status:             MVP Complete, Ready for Scale" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[INFO] Limited metrics available (demo environment)" -ForegroundColor Yellow
}

Write-Host "=======================================================================" -ForegroundColor Green
Write-Host "  INVESTOR TAKEAWAYS" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  1. PROVEN TECHNOLOGY" -ForegroundColor Yellow
Write-Host "     Full-stack MVP with real-time automation" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. SCALABLE INFRASTRUCTURE" -ForegroundColor Yellow
Write-Host "     Built for multi-city expansion" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. DATA-DRIVEN INSIGHTS" -ForegroundColor Yellow
Write-Host "     Comprehensive analytics for all stakeholders" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. MULTIPLE REVENUE STREAMS" -ForegroundColor Yellow
Write-Host "     Subscriptions, commissions, premium features" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. COMPETITIVE DIFFERENTIATION" -ForegroundColor Yellow
Write-Host "     Real-time data + AI-powered recommendations" -ForegroundColor Gray
Write-Host ""

Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host "  DEMO COMPLETE - THANK YOU!" -ForegroundColor Magenta
Write-Host "=======================================================================" -ForegroundColor Magenta
Write-Host ""
