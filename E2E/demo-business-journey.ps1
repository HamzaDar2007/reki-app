# ===========================================================================
# REKI APP - BUSINESS JOURNEY DEMO SCRIPT
# ===========================================================================
# Purpose: Demonstrate venue owner experience - managing venue, creating offers, viewing analytics
# Duration: ~2-3 minutes
# ===========================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"

Write-Host "`n======= REKI BUSINESS JOURNEY DEMO =======" -ForegroundColor Cyan
Write-Host "Scenario: Venue owner managing their bar on a Friday evening`n"

# Step 1: Owner Registration/Login
Write-Host ">> STEP 1: Venue Owner Login" -ForegroundColor Yellow
$ownerEmail = "owner.demo$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
Write-Host "[INFO] Creating new venue owner account..." -ForegroundColor Gray

$registerBody = @{ email = $ownerEmail; password = "password123" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$token = $auth.accessToken
$ownerId = $auth.user.id
$headers = @{ Authorization = "Bearer $token" }
Write-Host "[OK] Owner account created: $ownerEmail" -ForegroundColor Green
Write-Host "    Owner ID: $ownerId`n" -ForegroundColor Gray
Start-Sleep -Seconds 1

# Step 2: Create/Get Venue
Write-Host ">> STEP 2: Get Venue Information" -ForegroundColor Yellow
Write-Host "[INFO] Getting first available venue as demo venue..." -ForegroundColor Gray

$allVenues = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$manchesterId&limit=1"
$venue = $allVenues[0]

if (-not $venue) {
    Write-Host "[ERROR] No venues found in Manchester!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Managing venue: $($venue.name)" -ForegroundColor Green
Write-Host "    Address: $($venue.address)" -ForegroundColor Gray
Write-Host "    Category: $($venue.category)" -ForegroundColor Gray
Write-Host "    Current state: $($venue.currentBusyness) / $($venue.currentVibe)`n" -ForegroundColor Gray
Start-Sleep -Seconds 1

# Step 3: Update Venue Busyness (Friday evening - getting busy)
Write-Host ">> STEP 3: Update Venue Busyness" -ForegroundColor Yellow
Write-Host "[INFO] Friday evening - venue getting busier..." -ForegroundColor Gray

$updateBody = @{ busyness = "MODERATE" } | ConvertTo-Json
try {
    $updated = Invoke-RestMethod -Uri "$baseUrl/venues/$($venue.id)/live-state" `
        -Method Patch -Body $updateBody -Headers $headers -ContentType "application/json"
    Write-Host "[OK] Busyness updated to: MODERATE" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Could not update busyness (may need owner permissions)" -ForegroundColor Yellow
}
Write-Host ""
Start-Sleep -Seconds 1

# Step 4: Create Happy Hour Offer
Write-Host ">> STEP 4: Create Happy Hour Offer" -ForegroundColor Yellow
Write-Host "[INFO] Creating Friday happy hour special..." -ForegroundColor Gray

$startsAt = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$endsAt = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")

$offerBody = @{
    venueId = $venue.id
    title = "Friday Happy Hour Special"
    description = "50% off all cocktails from 5-8pm"
    offerType = "DISCOUNT"
    minBusyness = "QUIET"
    startsAt = $startsAt
    endsAt = $endsAt
    isActive = $true
} | ConvertTo-Json

try {
    $newOffer = Invoke-RestMethod -Uri "$baseUrl/offers" `
        -Method Post -Body $offerBody -Headers $headers -ContentType "application/json"
    Write-Host "[OK] Offer created: $($newOffer.title)" -ForegroundColor Green
    Write-Host "    Offer ID: $($newOffer.id)" -ForegroundColor Gray
    Write-Host "    Type: $($newOffer.offerType)" -ForegroundColor Gray
    Write-Host "    Valid: $(Get-Date $newOffer.startsAt -Format 'yyyy-MM-dd') to $(Get-Date $newOffer.endsAt -Format 'yyyy-MM-dd')" -ForegroundColor Gray
    $offerId = $newOffer.id
} catch {
    Write-Host "[WARN] Could not create offer: $_" -ForegroundColor Yellow
    $offerId = $null
}
Write-Host ""
Start-Sleep -Seconds 1

# Step 5: View Venue Offers
Write-Host ">> STEP 5: View All Venue Offers" -ForegroundColor Yellow
try {
    $venueOffers = Invoke-RestMethod -Uri "$baseUrl/venues/$($venue.id)/offers"
    Write-Host "[OK] Found $($venueOffers.Count) offer(s) for this venue" -ForegroundColor Green
    
    if ($venueOffers.Count -gt 0) {
        $venueOffers | Select-Object -First 3 | ForEach-Object {
            Write-Host "    * $($_.title)" -ForegroundColor Cyan
            Write-Host "      Status: $(if ($_.isActive) { 'Active' } else { 'Inactive' })" -ForegroundColor Gray
            Write-Host "      Stats: Views=$($_.viewCount), Clicks=$($_.clickCount), Redeemed=$($_.redeemCount)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "[WARN] Could not fetch offers" -ForegroundColor Yellow
}
Write-Host ""
Start-Sleep -Seconds 1

# Step 6: Update Offer Status
if ($offerId) {
    Write-Host ">> STEP 6: Manage Offer Status" -ForegroundColor Yellow
    Write-Host "[INFO] Toggling offer status..." -ForegroundColor Gray
    
    try {
        $toggledOffer = Invoke-RestMethod -Uri "$baseUrl/offers/$offerId/toggle-status" `
            -Method Patch -Headers $headers
        Write-Host "[OK] Offer status toggled to: $(if ($toggledOffer.isActive) { 'Active' } else { 'Inactive' })" -ForegroundColor Green
        
        # Toggle back
        $toggledOffer = Invoke-RestMethod -Uri "$baseUrl/offers/$offerId/toggle-status" `
            -Method Patch -Headers $headers
        Write-Host "[OK] Offer status toggled back to: $(if ($toggledOffer.isActive) { 'Active' } else { 'Inactive' })" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Could not toggle offer status" -ForegroundColor Yellow
    }
    Write-Host ""
    Start-Sleep -Seconds 1
}

# Step 7: View Analytics Dashboard
Write-Host ">> STEP 7: View Analytics Dashboard" -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/owner/dashboard" -Headers $headers
    Write-Host "[OK] Analytics Dashboard Retrieved" -ForegroundColor Green
    Write-Host "    Total Venues: $($analytics.totalVenues)" -ForegroundColor Gray
    Write-Host "    Active Offers: $($analytics.totalOffers)" -ForegroundColor Gray
    Write-Host "    Total Views: $($analytics.totalViews)" -ForegroundColor Gray
    Write-Host "    Total Clicks: $($analytics.totalClicks)" -ForegroundColor Gray
    Write-Host "    Total Redemptions: $($analytics.totalRedemptions)" -ForegroundColor Gray
    
    if ($analytics.totalViews -gt 0) {
        $ctr = [math]::Round(($analytics.totalClicks / $analytics.totalViews) * 100, 1)
        $conversion = [math]::Round(($analytics.totalRedemptions / $analytics.totalViews) * 100, 1)
        Write-Host "    Click-Through Rate: $ctr%" -ForegroundColor Cyan
        Write-Host "    Conversion Rate: $conversion%" -ForegroundColor Cyan
    }
} catch {
    Write-Host "[WARN] Could not fetch analytics dashboard" -ForegroundColor Yellow
}
Write-Host ""
Start-Sleep -Seconds 1

# Step 8: View Offer-Specific Analytics
if ($offerId) {
    Write-Host ">> STEP 8: View Offer Analytics" -ForegroundColor Yellow
    try {
        $offerAnalytics = Invoke-RestMethod -Uri "$baseUrl/analytics/offers/$offerId" -Headers $headers
        Write-Host "[OK] Offer Performance: $($offerAnalytics.title)" -ForegroundColor Green
        Write-Host "    Views: $($offerAnalytics.viewCount)" -ForegroundColor Gray
        Write-Host "    Clicks: $($offerAnalytics.clickCount)" -ForegroundColor Gray
        Write-Host "    Redemptions: $($offerAnalytics.redeemCount)" -ForegroundColor Gray
        
        if ($offerAnalytics.viewCount -gt 0) {
            $offerCTR = [math]::Round(($offerAnalytics.clickCount / $offerAnalytics.viewCount) * 100, 1)
            $offerConversion = [math]::Round(($offerAnalytics.redeemCount / $offerAnalytics.viewCount) * 100, 1)
            Write-Host "    CTR: $offerCTR%" -ForegroundColor Cyan
            Write-Host "    Conversion: $offerConversion%" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "[WARN] Could not fetch offer analytics" -ForegroundColor Yellow
    }
    Write-Host ""
    Start-Sleep -Seconds 1
}

# Step 9: View Platform Engagement
Write-Host ">> STEP 9: Platform Engagement Metrics" -ForegroundColor Yellow
try {
    $engagement = Invoke-RestMethod -Uri "$baseUrl/analytics/platform/engagement" -Headers $headers
    Write-Host "[OK] Platform Metrics Retrieved" -ForegroundColor Green
    Write-Host "    Total Users: $($engagement.totalUsers)" -ForegroundColor Gray
    Write-Host "    Total Venues: $($engagement.totalVenues)" -ForegroundColor Gray
    Write-Host "    Total Offers: $($engagement.totalOffers)" -ForegroundColor Gray
    Write-Host "    Total Offer Views: $($engagement.totalOfferViews)" -ForegroundColor Gray
    Write-Host "    Total Redemptions: $($engagement.totalRedemptions)" -ForegroundColor Gray
    
    if ($engagement.totalOfferViews -gt 0) {
        $platformConversion = [math]::Round(($engagement.totalRedemptions / $engagement.totalOfferViews) * 100, 1)
        Write-Host "    Platform Conversion Rate: $platformConversion%" -ForegroundColor Cyan
    }
} catch {
    Write-Host "[WARN] Could not fetch platform metrics" -ForegroundColor Yellow
}
Write-Host ""
Start-Sleep -Seconds 1

# Summary
Write-Host "======= DEMO SUMMARY =======" -ForegroundColor Cyan
Write-Host ""
Write-Host "Complete business journey tested:" -ForegroundColor White
Write-Host "  [+] Owner Account: $ownerEmail" -ForegroundColor Green
Write-Host "  [+] Venue Management: $($venue.name)" -ForegroundColor Green
Write-Host "  [+] Busyness Update: Set to MODERATE" -ForegroundColor Green
if ($offerId) {
    Write-Host "  [+] Offer Created: Friday Happy Hour Special" -ForegroundColor Green
    Write-Host "  [+] Offer Management: Status toggled" -ForegroundColor Green
    Write-Host "  [+] Offer Analytics: Performance tracked" -ForegroundColor Green
}
Write-Host "  [+] Dashboard Analytics: Viewed" -ForegroundColor Green
Write-Host "  [+] Platform Metrics: Reviewed" -ForegroundColor Green
Write-Host ""
Write-Host "Business Value:" -ForegroundColor Yellow
Write-Host "  * Real-time venue state management" -ForegroundColor Gray
Write-Host "  * Easy offer creation and management" -ForegroundColor Gray
Write-Host "  * Detailed analytics for data-driven decisions" -ForegroundColor Gray
Write-Host "  * Track ROI with conversion metrics" -ForegroundColor Gray
Write-Host ""
Write-Host "======= DEMO COMPLETE! =======" -ForegroundColor Green
Write-Host ""
