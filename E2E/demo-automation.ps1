# ===========================================================================
# REKI APP - AUTOMATION DEMO SCRIPT
# ===========================================================================
# Purpose: Demonstrate automated vibe switching and busyness simulation
# Duration: ~3-4 minutes
# ===========================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"
$manchesterId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"

Write-Host "`n======= REKI AUTOMATION DEMO =======" -ForegroundColor Cyan
Write-Host "Demonstrating time-based vibe automation and busyness simulation`n"

# Step 1: Check Automation Status
Write-Host ">> STEP 1: Check Automation Status" -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/automation/status"
    Write-Host "[OK] Automation System Status Retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Vibe Automation:" -ForegroundColor Cyan
    Write-Host "    Enabled: $($status.vibeAutomation.enabled)" -ForegroundColor Gray
    Write-Host "    Interval: $($status.vibeAutomation.interval)" -ForegroundColor Gray
    Write-Host "    Last Run: $($status.vibeAutomation.lastRun)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Busyness Simulation:" -ForegroundColor Cyan
    Write-Host "    Enabled: $($status.busynessSimulation.enabled)" -ForegroundColor Gray
    Write-Host "    Interval: $($status.busynessSimulation.interval)" -ForegroundColor Gray
    Write-Host "    Last Run: $($status.busynessSimulation.lastRun)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[ERROR] Could not fetch automation status: $_" -ForegroundColor Red
}
Start-Sleep -Seconds 2

# Step 2: View Current Venue States
Write-Host ">> STEP 2: Current Venue States (Before Automation)" -ForegroundColor Yellow
$venuesBefore = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$manchesterId&limit=5"
Write-Host "[OK] Fetched current state of first 5 venues" -ForegroundColor Green
Write-Host ""
$venuesBefore | ForEach-Object {
    $busynessColor = switch ($_.currentBusyness) {
        "BUSY" { "Red" }
        "MODERATE" { "Yellow" }
        default { "Green" }
    }
    Write-Host "  * $($_.name)" -ForegroundColor White
    Write-Host "    Busyness: $($_.currentBusyness)" -ForegroundColor $busynessColor -NoNewline
    Write-Host " | Vibe: $($_.currentVibe)" -ForegroundColor Magenta
}
Write-Host ""
Start-Sleep -Seconds 2

# Step 3: Run Friday Evening Scenario
Write-Host ">> STEP 3: Apply Friday Evening Scenario" -ForegroundColor Yellow
Write-Host "[INFO] Simulating busy Friday night with PARTY vibes..." -ForegroundColor Gray
try {
    $fridayResult = Invoke-RestMethod -Uri "$baseUrl/demo/friday-evening" -Method Post
    Write-Host "[OK] Friday evening scenario applied!" -ForegroundColor Green
    Write-Host "    Message: $($fridayResult.message)" -ForegroundColor Gray
    Write-Host "    Updated Venues: $($fridayResult.updatedVenues)" -ForegroundColor Gray
    if ($fridayResult.changes) {
        Write-Host "    Changes:" -ForegroundColor Gray
        Write-Host "      - Busyness: $($fridayResult.changes.busynessSet)" -ForegroundColor DarkGray
        Write-Host "      - Vibes: $($fridayResult.changes.vibesSet)" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "[ERROR] Could not apply Friday scenario: $_" -ForegroundColor Red
}
Write-Host ""
Start-Sleep -Seconds 2

# Step 4: View Updated Venue States
Write-Host ">> STEP 4: Venue States After Friday Scenario" -ForegroundColor Yellow
$venuesAfterFriday = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$manchesterId&limit=5"
Write-Host "[OK] Fetched updated venue states" -ForegroundColor Green
Write-Host ""
$venuesAfterFriday | ForEach-Object {
    $busynessColor = switch ($_.currentBusyness) {
        "BUSY" { "Red" }
        "MODERATE" { "Yellow" }
        default { "Green" }
    }
    Write-Host "  * $($_.name)" -ForegroundColor White
    Write-Host "    Busyness: $($_.currentBusyness)" -ForegroundColor $busynessColor -NoNewline
    Write-Host " | Vibe: $($_.currentVibe)" -ForegroundColor Magenta
}
Write-Host ""

# Count busyness levels
$busyCount = ($venuesAfterFriday | Where-Object { $_.currentBusyness -eq "BUSY" }).Count
$moderateCount = ($venuesAfterFriday | Where-Object { $_.currentBusyness -eq "MODERATE" }).Count
$quietCount = ($venuesAfterFriday | Where-Object { $_.currentBusyness -eq "QUIET" }).Count
$partyCount = ($venuesAfterFriday | Where-Object { $_.currentVibe -eq "PARTY" }).Count

Write-Host "  Summary:" -ForegroundColor Cyan
Write-Host "    BUSY: $busyCount venues" -ForegroundColor Red
Write-Host "    MODERATE: $moderateCount venues" -ForegroundColor Yellow
Write-Host "    QUIET: $quietCount venues" -ForegroundColor Green
Write-Host "    PARTY vibe: $partyCount venues" -ForegroundColor Magenta
Write-Host ""
Start-Sleep -Seconds 3

# Step 5: Run Quiet Monday Scenario
Write-Host ">> STEP 5: Apply Quiet Monday Scenario" -ForegroundColor Yellow
Write-Host "[INFO] Simulating quiet Monday afternoon with CHILL vibes..." -ForegroundColor Gray
try {
    $mondayResult = Invoke-RestMethod -Uri "$baseUrl/demo/quiet-monday" -Method Post
    Write-Host "[OK] Quiet Monday scenario applied!" -ForegroundColor Green
    Write-Host "    Message: $($mondayResult.message)" -ForegroundColor Gray
    Write-Host "    Updated Venues: $($mondayResult.updatedVenues)" -ForegroundColor Gray
    if ($mondayResult.changes) {
        Write-Host "    Changes:" -ForegroundColor Gray
        Write-Host "      - Busyness: $($mondayResult.changes.busynessSet)" -ForegroundColor DarkGray
        Write-Host "      - Vibes: $($mondayResult.changes.vibesSet)" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "[ERROR] Could not apply Monday scenario: $_" -ForegroundColor Red
}
Write-Host ""
Start-Sleep -Seconds 2

# Step 6: View Updated Venue States After Monday
Write-Host ">> STEP 6: Venue States After Monday Scenario" -ForegroundColor Yellow
$venuesAfterMonday = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$manchesterId&limit=5"
Write-Host "[OK] Fetched updated venue states" -ForegroundColor Green
Write-Host ""
$venuesAfterMonday | ForEach-Object {
    $busynessColor = switch ($_.currentBusyness) {
        "BUSY" { "Red" }
        "MODERATE" { "Yellow" }
        default { "Green" }
    }
    Write-Host "  * $($_.name)" -ForegroundColor White
    Write-Host "    Busyness: $($_.currentBusyness)" -ForegroundColor $busynessColor -NoNewline
    Write-Host " | Vibe: $($_.currentVibe)" -ForegroundColor Magenta
}
Write-Host ""

# Count busyness levels for Monday
$mondayBusyCount = ($venuesAfterMonday | Where-Object { $_.currentBusyness -eq "BUSY" }).Count
$mondayModerateCount = ($venuesAfterMonday | Where-Object { $_.currentBusyness -eq "MODERATE" }).Count
$mondayQuietCount = ($venuesAfterMonday | Where-Object { $_.currentBusyness -eq "QUIET" }).Count
$chillCount = ($venuesAfterMonday | Where-Object { $_.currentVibe -eq "CHILL" }).Count

Write-Host "  Summary:" -ForegroundColor Cyan
Write-Host "    BUSY: $mondayBusyCount venues" -ForegroundColor Red
Write-Host "    MODERATE: $mondayModerateCount venues" -ForegroundColor Yellow
Write-Host "    QUIET: $mondayQuietCount venues" -ForegroundColor Green
Write-Host "    CHILL vibe: $chillCount venues" -ForegroundColor Magenta
Write-Host ""
Start-Sleep -Seconds 3

# Step 7: Mixed Busyness Simulation
Write-Host ">> STEP 7: Apply Mixed Busyness Scenario" -ForegroundColor Yellow
Write-Host "[INFO] Creating realistic mix of busyness levels..." -ForegroundColor Gray
try {
    $mixedResult = Invoke-RestMethod -Uri "$baseUrl/demo/mixed-busyness" -Method Post
    Write-Host "[OK] Mixed busyness scenario applied!" -ForegroundColor Green
    Write-Host "    Message: $($mixedResult.message)" -ForegroundColor Gray
    Write-Host "    Updated Venues: $($mixedResult.updatedVenues)" -ForegroundColor Gray
    if ($mixedResult.changes) {
        Write-Host "    Distribution:" -ForegroundColor Gray
        Write-Host "      - BUSY: $($mixedResult.changes.busy) venues" -ForegroundColor DarkGray
        Write-Host "      - MODERATE: $($mixedResult.changes.moderate) venues" -ForegroundColor DarkGray
        Write-Host "      - QUIET: $($mixedResult.changes.quiet) venues" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "[ERROR] Could not apply mixed busyness: $_" -ForegroundColor Red
}
Write-Host ""
Start-Sleep -Seconds 2

# Step 8: Manual Venue Update (Venue Owner Perspective)
Write-Host ">> STEP 8: Manual Venue Update" -ForegroundColor Yellow
Write-Host "[INFO] Venue owner manually updates their venue state..." -ForegroundColor Gray
$testVenue = $venuesAfterMonday[0]
$manualUpdateBody = @{
    busyness = "BUSY"
    vibe = "LIVE_MUSIC"
} | ConvertTo-Json

try {
    $manualResult = Invoke-RestMethod -Uri "$baseUrl/automation/venues/$($testVenue.id)/manual-update" `
        -Method Post -Body $manualUpdateBody -ContentType "application/json"
    Write-Host "[OK] Manual update successful!" -ForegroundColor Green
    Write-Host "    Venue: $($testVenue.name)" -ForegroundColor Gray
    Write-Host "    New State: BUSY / LIVE_MUSIC" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Could not perform manual update (may require authentication)" -ForegroundColor Yellow
}
Write-Host ""
Start-Sleep -Seconds 2

# Step 9: Reset Demo State
Write-Host ">> STEP 9: Reset Demo State" -ForegroundColor Yellow
Write-Host "[INFO] Resetting all venues to default state..." -ForegroundColor Gray
try {
    $resetResult = Invoke-RestMethod -Uri "$baseUrl/demo/reset" -Method Post
    Write-Host "[OK] Demo state reset!" -ForegroundColor Green
    Write-Host "    Message: $($resetResult.message)" -ForegroundColor Gray
    Write-Host "    Reset Venues: $($resetResult.resetVenues)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Could not reset demo state: $_" -ForegroundColor Red
}
Write-Host ""
Start-Sleep -Seconds 1

# Summary
Write-Host "======= DEMO SUMMARY =======" -ForegroundColor Cyan
Write-Host ""
Write-Host "Automation System Capabilities Demonstrated:" -ForegroundColor White
Write-Host "  [+] Automation Status: Viewed system health" -ForegroundColor Green
Write-Host "  [+] Friday Evening: Applied busy night scenario" -ForegroundColor Green
Write-Host "    - Result: $busyCount BUSY, $moderateCount MODERATE, $quietCount QUIET" -ForegroundColor Gray
Write-Host "    - Party vibe: $partyCount venues" -ForegroundColor Gray
Write-Host "  [+] Quiet Monday: Applied quiet afternoon scenario" -ForegroundColor Green
Write-Host "    - Result: $mondayBusyCount BUSY, $mondayModerateCount MODERATE, $mondayQuietCount QUIET" -ForegroundColor Gray
Write-Host "    - Chill vibe: $chillCount venues" -ForegroundColor Gray
Write-Host "  [+] Mixed Busyness: Realistic distribution" -ForegroundColor Green
Write-Host "  [+] Manual Override: Owner can update anytime" -ForegroundColor Green
Write-Host "  [+] Demo Reset: Clean slate for next demo" -ForegroundColor Green
Write-Host ""
Write-Host "Key Features:" -ForegroundColor Yellow
Write-Host "  * Time-based vibe switching (cron: every 5 minutes)" -ForegroundColor Gray
Write-Host "  * Automated busyness simulation (cron: every 30 minutes)" -ForegroundColor Gray
Write-Host "  * Multiple scenario presets for demos" -ForegroundColor Gray
Write-Host "  * Manual override capability for venue owners" -ForegroundColor Gray
Write-Host "  * Real-time state updates across all venues" -ForegroundColor Gray
Write-Host ""
Write-Host "Business Value:" -ForegroundColor Cyan
Write-Host "  * Realistic demo environment for investors" -ForegroundColor Gray
Write-Host "  * Shows dynamic, living venue data" -ForegroundColor Gray
Write-Host "  * Demonstrates scalability of automation" -ForegroundColor Gray
Write-Host "  * Flexible control for both system and owners" -ForegroundColor Gray
Write-Host ""
Write-Host "======= DEMO COMPLETE! =======" -ForegroundColor Green
Write-Host ""
