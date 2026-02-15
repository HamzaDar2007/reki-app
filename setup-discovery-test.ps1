# Setup user preferences for testing discovery features
Write-Host "`n=== Setting Up User Preferences for Testing ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# First, register a test user if not exists
Write-Host "`n1. Creating test user..." -ForegroundColor Yellow
try {
    $registerData = @{
        email = "test-discovery@example.com"
        password = "password123"
        firstName = "Test"
        lastName = "Discovery"
    } | ConvertTo-Json
    
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerData -ContentType "application/json"
    Write-Host "   User registered successfully" -ForegroundColor Green
    $token = $registerResponse.access_token
} catch {
    # User might already exist, try to login
    Write-Host "   User exists, logging in..." -ForegroundColor Yellow
    $loginData = @{
        email = "test-discovery@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "   Logged in successfully" -ForegroundColor Green
}

# Update user preferences
Write-Host "`n2. Updating user preferences..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$preferencesData = @{
    preferredCategories = @("BAR", "CLUB")
    minBusyness = "MODERATE"
    preferredVibes = @("PARTY", "UPBEAT", "LIVE_MUSIC")
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/users/preferences" -Method Patch -Body $preferencesData -ContentType "application/json" -Headers $headers
    Write-Host "   Preferences updated:" -ForegroundColor Green
    Write-Host "   - Preferred categories: $($updateResponse.preferredCategories)" -ForegroundColor Gray
    Write-Host "   - Min busyness: $($updateResponse.minBusyness)" -ForegroundColor Gray
    Write-Host "   - Preferred vibes: $($updateResponse.preferredVibes)" -ForegroundColor Gray
} catch {
    Write-Host "   Error: $_" -ForegroundColor Red
}

# Test discovery with preferences
Write-Host "`n3. Testing venue discovery with user preferences..." -ForegroundColor Yellow
$cityId = "3ff5e526-7819-45d5-9995-bd6db919c9b2" # Manchester

# Without usePreferences
$response1 = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId" -Method Get -Headers $headers
Write-Host "   Without preferences: $($response1.Count) venues" -ForegroundColor Gray

# With usePreferences (should filter to BAR/CLUB only)
$response2 = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&usePreferences=true" -Method Get -Headers $headers
Write-Host "   With preferences: $($response2.Count) venues" -ForegroundColor Green
if ($response2.Count -gt 0) {
    Write-Host "   Sample venue: $($response2[0].name) - $($response2[0].category)" -ForegroundColor Green
}

# Show token for manual testing
Write-Host "`n4. Authentication token (for manual testing):" -ForegroundColor Yellow
Write-Host "   $token" -ForegroundColor Gray
Write-Host "`n   Use this in Postman/Insomnia as:" -ForegroundColor Gray
Write-Host "   Authorization: Bearer $token" -ForegroundColor Gray

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "Test user: test-discovery@example.com" -ForegroundColor White
Write-Host "Password: password123" -ForegroundColor White
Write-Host "Preferences: BAR/CLUB, MODERATE+, PARTY/UPBEAT/LIVE_MUSIC" -ForegroundColor White
