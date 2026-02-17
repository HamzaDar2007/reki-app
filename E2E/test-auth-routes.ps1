# Comprehensive Auth Routes Testing Script
# Tests all authentication endpoints in the REKI application

$baseUrl = "http://localhost:3000"
$testEmail = "authtest-$(Get-Random)@example.com"
$testPassword = "TestPassword123!"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   REKI Auth Routes Test Suite        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Track test results
$testsPassed = 0
$testsFailed = 0

# ============================================
# Test 1: Register New User
# ============================================
Write-Host ""
Write-Host "[TEST] POST /auth/register - Register new user" -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"

    if (-not $response.user.email -eq $testEmail) {
        throw "Registration failed: Email mismatch"
    }
    Write-Host "   User registered: $($response.user.email)" -ForegroundColor Gray
    Write-Host "   User ID: $($response.user.id)" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 2: Login with Credentials
# ============================================
$accessToken = $null
$refreshToken = $null

Write-Host ""
Write-Host "[TEST] POST /auth/login - Login with credentials" -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"

    if (-not $response.access_token) {
        throw "Login failed: No access token returned"
    }
    
    $accessToken = $response.access_token
    $refreshToken = $response.refresh_token
    
    Write-Host "   Access token received (length: $($response.access_token.Length))" -ForegroundColor Gray
    Write-Host "   Refresh token received (length: $($response.refresh_token.Length))" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 3: Get Current User Info
# ============================================
Write-Host ""
Write-Host "[TEST] GET /auth/me - Get current user info" -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers

    if (-not $response.email -eq $testEmail) {
        throw "User info mismatch"
    }
    
    Write-Host "   Email: $($response.email)" -ForegroundColor Gray
    Write-Host "   Name: $($response.name)" -ForegroundColor Gray
    Write-Host "   Role: $($response.role)" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 4: Refresh Access Token
# ============================================
$newAccessToken = $null

Write-Host ""
Write-Host "[TEST] POST /auth/refresh - Refresh access token" -ForegroundColor Yellow
try {
    $body = @{
        refreshToken = $refreshToken
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -Body $body -ContentType "application/json"

    if (-not $response.access_token) {
        throw "Token refresh failed: No access token returned"
    }
    
    $newAccessToken = $response.access_token
    Write-Host "   New access token received (length: $($response.access_token.Length))" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 5: Change Password
# ============================================
$newPassword = "NewTestPassword456!"

Write-Host ""
Write-Host "[TEST] POST /auth/change-password - Change password" -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }
    
    $body = @{
        oldPassword = $testPassword
        newPassword = $newPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" -Method Post -Headers $headers -Body $body -ContentType "application/json"

    Write-Host "   Password changed successfully" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 6: Login with New Password
# ============================================
Write-Host ""
Write-Host "[TEST] POST /auth/login - Login with new password" -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = $newPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"

    if (-not $response.access_token) {
        throw "Login with new password failed"
    }
    
    $accessToken = $response.access_token
    Write-Host "   Login successful with new password" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 7: Forgot Password Request
# ============================================
Write-Host ""
Write-Host "[TEST] POST /auth/forgot-password - Request password reset" -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" -Method Post -Body $body -ContentType "application/json"

    Write-Host "   Password reset email sent (check server logs for token)" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 8: Test Invalid Reset Token
# ============================================
Write-Host ""
Write-Host "[TEST] POST /auth/reset-password - Test invalid token handling" -ForegroundColor Yellow
try {
    $body = @{
        token = "invalid-token-12345"
        newPassword = "ShouldNotWork123!"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/reset-password" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have rejected invalid token"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 400) {
            Write-Host "   Correctly rejected invalid token" -ForegroundColor Gray
        }
        else {
            throw $_
        }
    }
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 9: Logout
# ============================================
Write-Host ""
Write-Host "[TEST] POST /auth/logout - Logout user" -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -Headers $headers

    Write-Host "   User logged out successfully" -ForegroundColor Gray
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 10: Verify Token Invalid After Logout
# ============================================
Write-Host ""
Write-Host "[TEST] GET /auth/me - Verify token invalid after logout" -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $accessToken"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers -ErrorAction Stop
        throw "Token should be invalid after logout"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   Token correctly invalidated after logout" -ForegroundColor Gray
        }
        else {
            throw $_
        }
    }
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 11: Duplicate Registration
# ============================================
Write-Host ""
Write-Host "[TEST] POST /auth/register - Test duplicate email rejection" -ForegroundColor Yellow  
try {
    $body = @{
        email = $testEmail
        password = "AnotherPassword789!"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have rejected duplicate email"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 409 -or $_.Exception.Response.StatusCode -eq 400 -or $_.Exception.Response.StatusCode -eq 500) {
            Write-Host "   Correctly rejected duplicate email (Status: $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Gray
        }
        else {
            throw $_
        }
    }
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Test 12: Invalid Login Credentials
# ============================================
Write-Host ""
Write-Host "[TEST] POST /auth/login - Test invalid credentials" -ForegroundColor Yellow
try {
    $body = @{
        email = $testEmail
        password = "WrongPassword123!"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        throw "Should have rejected invalid credentials"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   Correctly rejected invalid credentials" -ForegroundColor Gray
        }
        else {
            throw $_
        }
    }
    Write-Host "[PASSED]" -ForegroundColor Green
    $testsPassed++
}
catch {
    Write-Host "[FAILED] $_" -ForegroundColor Red
    $testsFailed++
}

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "         Test Results Summary          " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })
Write-Host "Total Tests:  $($testsPassed + $testsFailed)" -ForegroundColor White

if ($testsFailed -eq 0) {
    Write-Host ""
    Write-Host "All auth routes tested successfully!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "Some tests failed. Review the output above." -ForegroundColor Red
    exit 1
}
