# REKI Venues Module Test Script
Write-Host ""
Write-Host "========================================"
Write-Host "  TESTING VENUES MODULE - 7 ROUTES"
Write-Host "========================================"
Write-Host ""

# Setup
Write-Host "Setup: Getting test data..." -ForegroundColor Yellow
try {
    $cities = Invoke-RestMethod -Uri "http://localhost:3000/cities" -Method GET
    $cityId = ($cities | Where-Object { $_.name -eq "Manchester" })[0].id
    Write-Host "City ID: $cityId" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Cannot connect to server. Make sure it's running on port 3000" -ForegroundColor Red
    exit 1
}

# Test 1: GET /venues?cityId=...
Write-Host "1. Testing GET /venues?cityId=..." -ForegroundColor Yellow
try {
    $venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=$cityId" -Method GET
    Write-Host "   Found $($venues.Count) venues" -ForegroundColor Green
    $testVenueId = $venues[0].id
    $testVenueName = $venues[0].name
    Write-Host "   Using test venue: $testVenueName" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: GET /venues/:id
Write-Host "2. Testing GET /venues/:id" -ForegroundColor Yellow
try {
    $venue = Invoke-RestMethod -Uri "http://localhost:3000/venues/$testVenueId" -Method GET
    Write-Host "   Retrieved venue: $($venue.name)" -ForegroundColor Green
    Write-Host "   Busyness: $($venue.currentBusyness), Vibe: $($venue.currentVibe)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: GET /venues/:id/vibe-schedules
Write-Host "3. Testing GET /venues/:id/vibe-schedules" -ForegroundColor Yellow
try {
    $schedules = Invoke-RestMethod -Uri "http://localhost:3000/venues/$testVenueId/vibe-schedules" -Method GET
    Write-Host "   Found $($schedules.Count) vibe schedules" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: GET /venues/:id/current-vibe
Write-Host "4. Testing GET /venues/:id/current-vibe" -ForegroundColor Yellow
try {
    $currentVibe = Invoke-RestMethod -Uri "http://localhost:3000/venues/$testVenueId/current-vibe" -Method GET
    Write-Host "   Current vibe: $($currentVibe.vibe)" -ForegroundColor Green
    if ($currentVibe.nextChange) {
        Write-Host "   Next change: $($currentVibe.nextChange.vibe) at day $($currentVibe.nextChange.dayOfWeek)" -ForegroundColor Gray
    } else {
        Write-Host "   No upcoming vibe changes" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 5: POST /venues (requires auth)
Write-Host "5. Testing POST /venues (create venue - requires auth)" -ForegroundColor Yellow
try {
    $testUser = @{
        email = "venue_owner_$(Get-Random)@example.com"
        password = "VenueOwner123!"
    }
    $register = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -ContentType "application/json" -Body ($testUser | ConvertTo-Json)
    $token = $register.access_token
    Write-Host "   Created test owner: $($testUser.email)" -ForegroundColor Gray

    $newVenue = @{
        name = "Test Venue $(Get-Random)"
        cityId = $cityId
        category = "BAR"
        address = "123 Test Street"
        postcode = "M1 1AA"
        lat = 53.4808
        lng = -2.2426
        description = "A test venue"
    }
    $headers = @{ Authorization = "Bearer $token" }
    $createdVenue = Invoke-RestMethod -Uri "http://localhost:3000/venues" -Method POST -Headers $headers -ContentType "application/json" -Body ($newVenue | ConvertTo-Json)
    Write-Host "   Created venue: $($createdVenue.name) (ID: $($createdVenue.id))" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 6: PATCH /venues/:id/live-state (requires auth + ownership)
Write-Host "6. Testing PATCH /venues/:id/live-state (update live state)" -ForegroundColor Yellow
try {
    $liveStateUpdate = @{
        busyness = "BUSY"
        vibe = "PARTY"
    }
    $updatedState = Invoke-RestMethod -Uri "http://localhost:3000/venues/$($createdVenue.id)/live-state" -Method PATCH -Headers $headers -ContentType "application/json" -Body ($liveStateUpdate | ConvertTo-Json)
    Write-Host "   Updated: Busyness=$($updatedState.busyness), Vibe=$($updatedState.vibe)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 7: POST /venues/:id/vibe-schedules (requires auth + ownership)
Write-Host "7. Testing POST /venues/:id/vibe-schedules (create schedule)" -ForegroundColor Yellow
try {
    $vibeSchedule = @{
        dayOfWeek = 5
        startTime = "18:00"
        endTime = "23:00"
        vibe = "PARTY"
        priority = 1
    }
    $createdSchedule = Invoke-RestMethod -Uri "http://localhost:3000/venues/$($createdVenue.id)/vibe-schedules" -Method POST -Headers $headers -ContentType "application/json" -Body ($vibeSchedule | ConvertTo-Json)
    Write-Host "   Created vibe schedule: Day $($createdSchedule.dayOfWeek), $($createdSchedule.startTime)-$($createdSchedule.endTime), Vibe=$($createdSchedule.vibe)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "========================================"
Write-Host "  ALL 7 VENUES ROUTES TESTED"
Write-Host "========================================"
Write-Host ""
