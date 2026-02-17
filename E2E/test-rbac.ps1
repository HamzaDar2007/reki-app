# REKI RBAC (Role-Based Access Control) Test Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTING RBAC IMPLEMENTATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "http://localhost:3000"

# Test counters
$passedTests = 0
$failedTests = 0

function Test-Endpoint {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [bool]$ShouldSucceed = $true
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        
        if ($ShouldSucceed) {
            Write-Host "  ✅ PASS: $TestName" -ForegroundColor Green
            $script:passedTests++
            return $true
        } else {
            Write-Host "  ❌ FAIL: $TestName (Should have been denied but succeeded)" -ForegroundColor Red
            $script:failedTests++
            return $false
        }
    } catch {
        if (-not $ShouldSucceed) {
            # Expected to fail
            if ($_.Exception.Response.StatusCode -in @(401, 403)) {
                Write-Host "  ✅ PASS: $TestName (Correctly denied)" -ForegroundColor Green
                $script:passedTests++
                return $true
            }
        }
        Write-Host "  ❌ FAIL: $TestName - $($_.Exception.Message)" -ForegroundColor Red
        $script:failedTests++
        return $false
    }
}

# Step 1: Create test users with different roles
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 1: Creating Test Users" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Regular USER
Write-Host "1. Creating regular USER..." -ForegroundColor Cyan
$regularUser = @{
    email = "user_$(Get-Random)@example.com"
    password = "Password123!"
    role = "USER"
}
try {
    $userRegister = Invoke-RestMethod -Uri "$API_BASE/auth/register" -Method POST -ContentType "application/json" -Body ($regularUser | ConvertTo-Json)
    $userToken = $userRegister.access_token
    Write-Host "  ✅ Regular USER created: $($regularUser.email)" -ForegroundColor Green
    Write-Host "  Role: $($userRegister.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to create USER: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# BUSINESS user
Write-Host "2. Creating BUSINESS user..." -ForegroundColor Cyan
$businessUser = @{
    email = "business_$(Get-Random)@example.com"
    password = "Password123!"
    role = "BUSINESS"
}
try {
    $businessRegister = Invoke-RestMethod -Uri "$API_BASE/auth/register" -Method POST -ContentType "application/json" -Body ($businessUser | ConvertTo-Json)
    $businessToken = $businessRegister.access_token
    $businessUserId = $businessRegister.user.id
    Write-Host "  ✅ BUSINESS user created: $($businessUser.email)" -ForegroundColor Green
    Write-Host "  Role: $($businessRegister.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to create BUSINESS user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ADMIN user
Write-Host "3. Creating ADMIN user..." -ForegroundColor Cyan
$adminUser = @{
    email = "admin_$(Get-Random)@example.com"
    password = "Password123!"
    role = "ADMIN"
}
try {
    $adminRegister = Invoke-RestMethod -Uri "$API_BASE/auth/register" -Method POST -ContentType "application/json" -Body ($adminUser | ConvertTo-Json)
    $adminToken = $adminRegister.access_token
    Write-Host "  ✅ ADMIN user created: $($adminUser.email)" -ForegroundColor Green
    Write-Host "  Role: $($adminRegister.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ Failed to create ADMIN user: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Test Venue Permissions
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 2: Testing Venue Permissions" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Get city ID
$cities = Invoke-RestMethod -Uri "$API_BASE/cities" -Method GET
$cityId = ($cities | Where-Object { $_.name -eq "Manchester" })[0].id

$newVenue = @{
    name = "RBAC Test Venue $(Get-Random)"
    cityId = $cityId
    category = "BAR"
    address = "123 Test Street"
    postcode = "M1 1AA"
    lat = 53.4808
    lng = -2.2426
    description = "Test venue for RBAC"
}

Write-Host "Testing: Create Venue" -ForegroundColor Cyan
Test-Endpoint -TestName "USER cannot create venue" `
    -Method "POST" -Url "$API_BASE/venues" `
    -Headers @{ Authorization = "Bearer $userToken" } `
    -Body $newVenue -ShouldSucceed $false

Test-Endpoint -TestName "BUSINESS can create venue" `
    -Method "POST" -Url "$API_BASE/venues" `
    -Headers @{ Authorization = "Bearer $businessToken" } `
    -Body $newVenue -ShouldSucceed $true

# Get the created venue ID
$businessVenues = Invoke-RestMethod -Uri "$API_BASE/venues?cityId=$cityId" -Method GET
$testVenue = $businessVenues | Where-Object { $_.name -like "RBAC Test Venue*" } | Select-Object -First 1

if ($testVenue) {
    Write-Host ""
    Write-Host "Testing: Update Venue Live State" -ForegroundColor Cyan
    
    $liveStateUpdate = @{
        busyness = "BUSY"
        vibe = "PARTY"
    }
    
    Test-Endpoint -TestName "USER cannot update live state" `
        -Method "PATCH" -Url "$API_BASE/venues/$($testVenue.id)/live-state" `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -Body $liveStateUpdate -ShouldSucceed $false
    
    Test-Endpoint -TestName "Venue owner can update live state" `
        -Method "PATCH" -Url "$API_BASE/venues/$($testVenue.id)/live-state" `
        -Headers @{ Authorization = "Bearer $businessToken" } `
        -Body $liveStateUpdate -ShouldSucceed $true
    
    Test-Endpoint -TestName "ADMIN can update any venue live state" `
        -Method "PATCH" -Url "$API_BASE/venues/$($testVenue.id)/live-state" `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -Body $liveStateUpdate -ShouldSucceed $true
    
    Write-Host ""
    Write-Host "Testing: Create Vibe Schedule" -ForegroundColor Cyan
    
    $vibeSchedule = @{
        dayOfWeek = 5
        startTime = "18:00"
        endTime = "23:00"
        vibe = "PARTY"
        priority = 1
    }
    
    Test-Endpoint -TestName "USER cannot create vibe schedule" `
        -Method "POST" -Url "$API_BASE/venues/$($testVenue.id)/vibe-schedules" `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -Body $vibeSchedule -ShouldSucceed $false
    
    Test-Endpoint -TestName "Venue owner can create vibe schedule" `
        -Method "POST" -Url "$API_BASE/venues/$($testVenue.id)/vibe-schedules" `
        -Headers @{ Authorization = "Bearer $businessToken" } `
        -Body $vibeSchedule -ShouldSucceed $true
}

Write-Host ""

# Step 3: Test Offer Permissions
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 3: Testing Offer Permissions" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

if ($testVenue) {
    $newOffer = @{
        venueId = $testVenue.id
        title = "RBAC Test Offer"
        description = "Test offer for RBAC"
        offerType = "DISCOUNT"
        startsAt = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endsAt = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    
    Write-Host "Testing: Create Offer" -ForegroundColor Cyan
    
    Test-Endpoint -TestName "USER cannot create offer" `
        -Method "POST" -Url "$API_BASE/offers" `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -Body $newOffer -ShouldSucceed $false
    
    Test-Endpoint -TestName "Venue owner can create offer" `
        -Method "POST" -Url "$API_BASE/offers" `
        -Headers @{ Authorization = "Bearer $businessToken" } `
        -Body $newOffer -ShouldSucceed $true
    
    # Get created offer
    $offers = Invoke-RestMethod -Uri "$API_BASE/offers?venueId=$($testVenue.id)" -Method GET
    $testOffer = $offers | Where-Object { $_.title -eq "RBAC Test Offer" } | Select-Object -First 1
    
    if ($testOffer) {
        Write-Host ""
        Write-Host "Testing: Update Offer Status" -ForegroundColor Cyan
        
        $offerStatusUpdate = @{
            isActive = $false
        }
        
        Test-Endpoint -TestName "USER cannot update offer status" `
            -Method "PATCH" -Url "$API_BASE/offers/$($testOffer.id)/status" `
            -Headers @{ Authorization = "Bearer $userToken" } `
            -Body $offerStatusUpdate -ShouldSucceed $false
        
        Test-Endpoint -TestName "Offer owner can update offer status" `
            -Method "PATCH" -Url "$API_BASE/offers/$($testOffer.id)/status" `
            -Headers @{ Authorization = "Bearer $businessToken" } `
            -Body $offerStatusUpdate -ShouldSucceed $true
    }
}

Write-Host ""

# Step 4: Test Analytics Permissions
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "STEP 4: Testing Analytics Permissions" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Testing: Owner Dashboard" -ForegroundColor Cyan

Test-Endpoint -TestName "USER cannot access owner dashboard" `
    -Method "GET" -Url "$API_BASE/analytics/owner/dashboard" `
    -Headers @{ Authorization = "Bearer $userToken" } `
    -ShouldSucceed $false

Test-Endpoint -TestName "BUSINESS can access owner dashboard" `
    -Method "GET" -Url "$API_BASE/analytics/owner/dashboard" `
    -Headers @{ Authorization = "Bearer $businessToken" } `
    -ShouldSucceed $true

Test-Endpoint -TestName "ADMIN can access owner dashboard" `
    -Method "GET" -Url "$API_BASE/analytics/owner/dashboard" `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -ShouldSucceed $true

if ($testVenue) {
    Write-Host ""
    Write-Host "Testing: Venue Analytics" -ForegroundColor Cyan
    
    Test-Endpoint -TestName "USER cannot access venue analytics" `
        -Method "GET" -Url "$API_BASE/analytics/venues/$($testVenue.id)" `
        -Headers @{ Authorization = "Bearer $userToken" } `
        -ShouldSucceed $false
    
    Test-Endpoint -TestName "Venue owner can access their venue analytics" `
        -Method "GET" -Url "$API_BASE/analytics/venues/$($testVenue.id)" `
        -Headers @{ Authorization = "Bearer $businessToken" } `
        -ShouldSucceed $true
    
    Test-Endpoint -TestName "ADMIN can access any venue analytics" `
        -Method "GET" -Url "$API_BASE/analytics/venues/$($testVenue.id)" `
        -Headers @{ Authorization = "Bearer $adminToken" } `
        -ShouldSucceed $true
}

Write-Host ""
Write-Host "Testing: Platform Analytics" -ForegroundColor Cyan

Test-Endpoint -TestName "USER cannot access platform analytics" `
    -Method "GET" -Url "$API_BASE/analytics/platform/engagement" `
    -Headers @{ Authorization = "Bearer $userToken" } `
    -ShouldSucceed $false

Test-Endpoint -TestName "BUSINESS cannot access platform analytics" `
    -Method "GET" -Url "$API_BASE/analytics/platform/engagement" `
    -Headers @{ Authorization = "Bearer $businessToken" } `
    -ShouldSucceed $false

Test-Endpoint -TestName "ADMIN can access platform analytics" `
    -Method "GET" -Url "$API_BASE/analytics/platform/engagement" `
    -Headers @{ Authorization = "Bearer $adminToken" } `
    -ShouldSucceed $true

Write-Host ""

# Final Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RBAC TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests: $($passedTests + $failedTests)" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "🎉 ALL RBAC TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "RBAC Summary:" -ForegroundColor Cyan
    Write-Host "  ✅ USER role: Can browse venues and redeem offers" -ForegroundColor Green
    Write-Host "  ✅ BUSINESS role: Can manage venues, offers, and view analytics" -ForegroundColor Green
    Write-Host "  ✅ ADMIN role: Full platform access" -ForegroundColor Green
} else {
    Write-Host "❌ Some RBAC tests failed. Please review above." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
