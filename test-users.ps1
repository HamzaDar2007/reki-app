# Test Users Module Routes
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING USERS MODULE ROUTES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }

# Step 1: Register a test user to get a token
Write-Host "1. Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    email = "testuser$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Headers $headers -Body $registerBody
    Write-Host "Success: Test user registered" -ForegroundColor Green
    Write-Host "  User ID: $($registerResponse.user.id)" -ForegroundColor Gray
    Write-Host "  Email: $($registerResponse.user.email)" -ForegroundColor Gray
    $testUserId = $registerResponse.user.id
    $testUserEmail = $registerResponse.user.email
    $token = $registerResponse.access_token
    Write-Host ""
} catch {
    Write-Host "Failed to register test user" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Add auth header
$authHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Step 2: Get all users
Write-Host "2. GET /users - Get all users" -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $authHeaders
    Write-Host "Success: Retrieved all users" -ForegroundColor Green
    Write-Host "  Total users: $($usersResponse.Count)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to get all users" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Get user by ID
Write-Host "3. GET /users/:id - Get user by ID" -ForegroundColor Yellow
try {
    $userByIdResponse = Invoke-RestMethod -Uri "$baseUrl/users/$testUserId" -Method Get -Headers $authHeaders
    Write-Host "Success: Retrieved user by ID" -ForegroundColor Green
    Write-Host "  User ID: $($userByIdResponse.id)" -ForegroundColor Gray
    Write-Host "  Email: $($userByIdResponse.email)" -ForegroundColor Gray
    Write-Host "  Active: $($userByIdResponse.isActive)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to get user by ID" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Update user
Write-Host "4. PATCH /users/:id - Update user" -ForegroundColor Yellow
$newEmail = "updated_$testUserEmail"
$updateBody = @{
    email = $newEmail
    isActive = $false
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/$testUserId" -Method Patch -Headers $authHeaders -Body $updateBody
    Write-Host "Success: Updated user" -ForegroundColor Green
    Write-Host "  User ID: $($updateResponse.id)" -ForegroundColor Gray
    Write-Host "  New Email: $($updateResponse.email)" -ForegroundColor Gray
    Write-Host "  Active: $($updateResponse.isActive)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to update user" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 5: Delete user
Write-Host "5. DELETE /users/:id - Delete user" -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/users/$testUserId" -Method Delete -Headers $authHeaders
    Write-Host "Success: Deleted user" -ForegroundColor Green
    Write-Host "  Message: $($deleteResponse.message)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed to delete user" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Step 6: Verify deletion
Write-Host "6. Verify deletion - GET deleted user should fail" -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/users/$testUserId" -Method Get -Headers $authHeaders -ErrorAction Stop
    Write-Host "Error: User still exists after deletion" -ForegroundColor Red
    Write-Host ""
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "Success: User successfully deleted (404 Not Found)" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "Unexpected error" -ForegroundColor Red
        Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "USERS MODULE TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

