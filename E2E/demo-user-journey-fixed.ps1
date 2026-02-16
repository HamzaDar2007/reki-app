# ================================================================
# REKI APP - USER JOURNEY DEMO SCRIPT
# ================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"

Write-Host "`n======= REKI USER JOURNEY DEMO =======" -ForegroundColor Cyan
Write-Host "Scenario: Friday evening, looking for fun night out in Manchester`n"

# Step 1: Register
Write-Host ">> STEP 1: User Registration" -ForegroundColor Yellow
$email = "sarah.demo$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$registerBody = @{ email = $email; password = "password123" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$token = $auth.accessToken
$headers = @{ Authorization = "Bearer $token" }
Write-Host "[OK] Account created: $email`n" -ForegroundColor Green
Start-Sleep -Seconds 1

# Step 2: Discover venues
Write-Host ">> STEP 2: Discover Manchester Venues" -ForegroundColor Yellow
$allVenues = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$manchesterId"
Write-Host "[OK] Found $($allVenues.Count) venues in Manchester" -ForegroundColor Green
$allVenues | Select-Object -First 3 | ForEach-Object {
    Write-Host "    * $($_.name) ($($_.category)) - $($_.currentBusyness)" -ForegroundColor Gray
}
Write-Host ""
Start-Sleep -Seconds 1

# Step 3: Filter venues
Write-Host ">> STEP 3: Filter Venues by Preferences" -ForegroundColor Yellow
Write-Host "[INFO] Filtering for: BAR category, not too busy, PARTY vibes" -ForegroundColor Gray

$filtered = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$manchesterId&category=BAR&minBusyness=QUIET&vibes=PARTY,LIVE_MUSIC&hasActiveOffers=true"
Write-Host "[OK] Filtered to $($filtered.Count) venues with active offers" -ForegroundColor Green
$filtered | Select-Object -First 2 | ForEach-Object {
    Write-Host "    * $($_.name) - $($_.activeOffers.Count) offer(s)" -ForegroundColor Gray
}
Write-Host ""
Start-Sleep -Seconds 1

# Step 4: View venue details
Write-Host ">> STEP 4: View Venue Details" -ForegroundColor Yellow
$selectedVenue = $filtered | Where-Object { $_.activeOffers.Count -gt 0 } | Select-Object -First 1
$venueDetails = Invoke-RestMethod -Uri "$baseUrl/venues/$($selectedVenue.id)"
Write-Host "[OK] Viewing: $($venueDetails.name)" -ForegroundColor Green
Write-Host "    Address: $($venueDetails.address)" -ForegroundColor Gray
Write-Host "    Vibe: $($venueDetails.currentVibe) | Busyness: $($venueDetails.currentBusyness)" -ForegroundColor Gray
Write-Host "    Offers: $($venueDetails.activeOffers.Count) active" -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 1

# Step 5: Track offer interaction
Write-Host ">> STEP 5: Track Offer Interaction" -ForegroundColor Yellow
$offer = $venueDetails.activeOffers[0]
$offerId = $offer.id
$viewResp = Invoke-RestMethod -Uri "$baseUrl/offers/$offerId/view" -Method Post -Headers $headers
Write-Host "[OK] Offer view tracked: $($offer.title)" -ForegroundColor Green

$clickResp = Invoke-RestMethod -Uri "$baseUrl/offers/$offerId/click" -Method Post -Headers $headers
Write-Host "[OK] Offer click tracked (CTR: $([math]::Round(($clickResp.clickCount/$viewResp.viewCount)*100,1))%)" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 1

# Step 6: Redeem offer
Write-Host ">> STEP 6: Redeem Offer" -ForegroundColor Yellow
$redemption = Invoke-RestMethod -Uri "$baseUrl/offers/$offerId/redeem" -Method Post -Headers $headers
Write-Host "[OK] *** OFFER REDEEMED! ***" -ForegroundColor Green
Write-Host "    Redemption ID: $($redemption.redemption.id)" -ForegroundColor Gray
Write-Host "    Venue: $($venueDetails.name)" -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 1

# Step 7: Check notifications
Write-Host ">> STEP 7: Check Notifications" -ForegroundColor Yellow
$notifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Headers $headers
$unreadCount = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Headers $headers
Write-Host "[OK] Notifications: $($notifications.Count) total, $($unreadCount.unreadCount) unread" -ForegroundColor Green
if ($notifications.Count -gt 0) {
    $notifications | Select-Object -First 2 | ForEach-Object {
        Write-Host "    [$($_.type)] $($_.title)" -ForegroundColor Gray
    }
}
Write-Host ""
Start-Sleep -Seconds 1

# Step 8: View profile
Write-Host ">> STEP 8: View Profile" -ForegroundColor Yellow
$profile = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Headers $headers
Write-Host "[OK] Profile: $($profile.email) (Active: $($profile.isActive))" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "======= DEMO SUMMARY =======" -ForegroundColor Cyan
Write-Host ""
Write-Host "Complete user journey tested:" -ForegroundColor White
Write-Host "  [+] Registration: $email" -ForegroundColor Green
Write-Host "  [+] Discovery: $($allVenues.Count) venues" -ForegroundColor Green
Write-Host "  [+] Filtering: $($filtered.Count) matching search criteria" -ForegroundColor Green
Write-Host "  [+] Engagement: Viewed venue & offers" -ForegroundColor Green
Write-Host "  [+] Tracking: View + Click tracked" -ForegroundColor Green
Write-Host "  [+] Redemption: Offer redeemed successfully" -ForegroundColor Green
Write-Host "  [+] Notifications: $($notifications.Count) notifications checked" -ForegroundColor Green
Write-Host ""
Write-Host "Key Metrics:" -ForegroundColor Yellow
Write-Host "  * User journey: ~30 seconds" -ForegroundColor Gray
Write-Host "  * Conversion rate: 100% (demo)" -ForegroundColor Gray
Write-Host "  * Engagement: High (view -> click -> redeem)" -ForegroundColor Gray
Write-Host ""
Write-Host "======= DEMO COMPLETE! =======" -ForegroundColor Green
Write-Host ""