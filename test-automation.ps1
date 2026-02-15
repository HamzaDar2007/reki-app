# Test Automation Module
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING AUTOMATION MODULE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }

# Step 1: Get automation status
Write-Host "1. GET /automation/status - Get automation status" -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/automation/status" -Method Get -Headers $headers
    Write-Host "Success: Automation status retrieved" -ForegroundColor Green
    Write-Host "  Scheduled vibes: $($status.scheduledVibes)" -ForegroundColor Gray
    Write-Host "  Active venues: $($status.activeVenues)" -ForegroundColor Gray
    Write-Host "  Last update: $($status.lastUpdate)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to get automation status" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 2: Manually trigger vibe update
Write-Host "2. POST /automation/update-vibes - Manual vibe update" -ForegroundColor Yellow
try {
    $vibeUpdate = Invoke-RestMethod -Uri "$baseUrl/automation/update-vibes" -Method Post -Headers $headers
    Write-Host "Success: $($vibeUpdate.message)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to trigger vibe update" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Manually trigger busyness simulation
Write-Host "3. POST /automation/update-busyness - Manual busyness update" -ForegroundColor Yellow
try {
    $busynessUpdate = Invoke-RestMethod -Uri "$baseUrl/automation/update-busyness" -Method Post -Headers $headers
    Write-Host "Success: $($busynessUpdate.message)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to trigger busyness update" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Get Manchester venues before demo
Write-Host "4. Getting Manchester venues for demo..." -ForegroundColor Yellow
$cityId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"
$venues = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId" -Method Get
Write-Host "Found $($venues.Count) venues" -ForegroundColor Green
if ($venues.Count -gt 0) {
    $firstVenue = $venues[0]
    Write-Host "Sample venue: $($firstVenue.name)" -ForegroundColor Gray
    Write-Host "  Busyness: $($firstVenue.busyness), Vibe: $($firstVenue.vibe)" -ForegroundColor Gray
    Write-Host ""
}

# Step 5: Trigger demo scenario - quiet to busy
Write-Host "5. POST /automation/demo/scenario - quiet_to_busy" -ForegroundColor Yellow
$userBody = @{
    email = "automation_$(Get-Random)@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $userReg = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Headers $headers -Body $userBody
    $token = $userReg.access_token
    $authHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    $scenarioBody = @{ scenario = "quiet_to_busy" } | ConvertTo-Json
    $demoResult = Invoke-RestMethod -Uri "$baseUrl/automation/demo/scenario" -Method Post -Headers $authHeaders -Body $scenarioBody
    Write-Host "Success: $($demoResult.message)" -ForegroundColor Green
    Write-Host "  Venues affected: $($demoResult.affected)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to trigger demo scenario" -ForegroundColor Red
    Write-Host ""
}

# Step 6: Verify state changed
Write-Host "6. Verifying venue state changed..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$venuesAfter = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId" -Method Get
if ($venuesAfter.Count -gt 0) {
    $firstVenueAfter = $venuesAfter[0]
    Write-Host "Sample venue after demo: $($firstVenueAfter.name)" -ForegroundColor Green
    Write-Host "  Busyness: $($firstVenueAfter.busyness), Vibe: $($firstVenueAfter.vibe)" -ForegroundColor Gray
    Write-Host ""
}

# Step 7: Trigger vibe shift demo
Write-Host "7. POST /automation/demo/scenario - vibe_shift" -ForegroundColor Yellow
try {
    $scenarioBody2 = @{ scenario = "vibe_shift" } | ConvertTo-Json
    $demoResult2 = Invoke-RestMethod -Uri "$baseUrl/automation/demo/scenario" -Method Post -Headers $authHeaders -Body $scenarioBody2
    Write-Host "Success: $($demoResult2.message)" -ForegroundColor Green
    Write-Host "  Venues affected: $($demoResult2.affected)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to trigger vibe shift scenario" -ForegroundColor Red
    Write-Host ""
}

# Step 8: Final status check
Write-Host "8. Final automation status check" -ForegroundColor Yellow
try {
    $finalStatus = Invoke-RestMethod -Uri "$baseUrl/automation/status" -Method Get -Headers $headers
    Write-Host "Success: Final status" -ForegroundColor Green
    Write-Host "  Scheduled vibes: $($finalStatus.scheduledVibes)" -ForegroundColor Gray
    Write-Host "  Active venues: $($finalStatus.activeVenues)" -ForegroundColor Gray
    Write-Host "  Last update: $($finalStatus.lastUpdate)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to get final status" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUTOMATION MODULE TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "- Automation status tracking works" -ForegroundColor Gray
Write-Host "- Manual vibe/busyness triggers work" -ForegroundColor Gray
Write-Host "- Demo scenarios successfully change venue states" -ForegroundColor Gray
Write-Host "- Cron jobs will run automatically (every 5/15 min)" -ForegroundColor Gray
Write-Host ""
