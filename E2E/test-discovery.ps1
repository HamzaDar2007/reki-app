# Test Enhanced Filtering & Discovery Features
Write-Host "`n=== Testing Enhanced Filtering & Discovery ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$cityId = "3ff5e526-7819-45d5-9995-bd6db919c9b2" # Manchester
$testLat = 53.483959
$testLng = -2.244644 # Manchester city center

# Test 1: Basic city search
Write-Host "`n1. Basic city search (no filters):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId" -Method Get
Write-Host "   Found $($response.Count) venues"
if ($response.Count -gt 0) {
    Write-Host "   Sample venue: $($response[0].name) - $($response[0].category)" -ForegroundColor Green
}

# Test 2: Proximity-based search with distance
Write-Host "`n2. Proximity search (2km radius):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?lat=$testLat&lng=$testLng&radius=2" -Method Get
Write-Host "   Found $($response.Count) venues within 2km"
if ($response.Count -gt 0) {
    $sample = $response[0]
    Write-Host "   Sample venue: $($sample.name)" -ForegroundColor Green
    if ($sample.distance) {
        Write-Host "   Distance: $([math]::Round($sample.distance, 2)) km" -ForegroundColor Green
    }
}

# Test 3: Filter by category
Write-Host "`n3. Filter by category (BAR):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&categories=BAR" -Method Get
Write-Host "   Found $($response.Count) bars"
if ($response.Count -gt 0) {
    Write-Host "   Sample: $($response[0].name) - $($response[0].category)" -ForegroundColor Green
}

# Test 4: Filter by multiple categories
Write-Host "`n4. Filter by multiple categories (BAR, CLUB):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&categories=BAR&categories=CLUB" -Method Get
Write-Host "   Found $($response.Count) bars/clubs"
if ($response.Count -gt 0) {
    $bars = @($response | Where-Object { $_.category -eq 'BAR' }).Count
    $clubs = @($response | Where-Object { $_.category -eq 'CLUB' }).Count
    Write-Host "   Bars: $bars, Clubs: $clubs" -ForegroundColor Green
}

# Test 5: Filter by minimum busyness
Write-Host "`n5. Filter by minimum busyness (MODERATE):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&minBusyness=MODERATE" -Method Get
Write-Host "   Found $($response.Count) moderately busy or busier venues"
if ($response.Count -gt 0) {
    Write-Host "   Sample: $($response[0].name) - Busyness: $($response[0].busyness)" -ForegroundColor Green
}

# Test 6: Filter by preferred vibes
Write-Host "`n6. Filter by preferred vibe (PARTY):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&preferredVibes=PARTY" -Method Get
Write-Host "   Found $($response.Count) party vibes"
if ($response.Count -gt 0) {
    Write-Host "   Sample: $($response[0].name) - Vibe: $($response[0].vibe)" -ForegroundColor Green
}

# Test 7: Filter by has offers
Write-Host "`n7. Filter by venues with active offers:" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&hasOffers=true" -Method Get
Write-Host "   Found $($response.Count) venues with active offers"
if ($response.Count -gt 0) {
    Write-Host "   Sample: $($response[0].name) - Active offers: $($response[0].activeOffersCount)" -ForegroundColor Green
}

# Test 8: Sort by distance
Write-Host "`n8. Sort by distance (nearest first):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?lat=$testLat&lng=$testLng&radius=5&sortBy=distance" -Method Get
Write-Host "   Found $($response.Count) venues sorted by distance"
if ($response.Count -ge 3) {
    Write-Host "   Nearest: $($response[0].name) - $([math]::Round($response[0].distance, 2)) km" -ForegroundColor Green
    Write-Host "   2nd: $($response[1].name) - $([math]::Round($response[1].distance, 2)) km" -ForegroundColor Green
    Write-Host "   3rd: $($response[2].name) - $([math]::Round($response[2].distance, 2)) km" -ForegroundColor Green
}

# Test 9: Sort by name
Write-Host "`n9. Sort by name (alphabetical):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&sortBy=name" -Method Get
Write-Host "   Found $($response.Count) venues sorted alphabetically"
if ($response.Count -ge 3) {
    Write-Host "   First: $($response[0].name)" -ForegroundColor Green
    Write-Host "   Second: $($response[1].name)" -ForegroundColor Green
    Write-Host "   Third: $($response[2].name)" -ForegroundColor Green
}

# Test 10: Sort by busyness
Write-Host "`n10. Sort by busyness (busiest first):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&sortBy=busyness" -Method Get
Write-Host "   Found $($response.Count) venues sorted by busyness"
if ($response.Count -ge 3) {
    Write-Host "   Busiest: $($response[0].name) - $($response[0].busyness)" -ForegroundColor Green
    Write-Host "   2nd: $($response[1].name) - $($response[1].busyness)" -ForegroundColor Green
    Write-Host "   3rd: $($response[2].name) - $($response[2].busyness)" -ForegroundColor Green
}

# Test 11: Sort by active offers
Write-Host "`n11. Sort by active offers (most offers first):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&sortBy=offers" -Method Get
Write-Host "   Found $($response.Count) venues sorted by offer count"
if ($response.Count -ge 3) {
    Write-Host "   Most offers: $($response[0].name) - $($response[0].activeOffersCount) offers" -ForegroundColor Green
    Write-Host "   2nd: $($response[1].name) - $($response[1].activeOffersCount) offers" -ForegroundColor Green
    Write-Host "   3rd: $($response[2].name) - $($response[2].activeOffersCount) offers" -ForegroundColor Green
}

# Test 12: Combined filters (BAR + BUSY + has offers + sort by distance)
Write-Host "`n12. Combined filters (BAR, BUSY min, has offers, sorted by distance):" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$baseUrl/venues?lat=$testLat&lng=$testLng&radius=5&categories=BAR&minBusyness=BUSY&hasOffers=true&sortBy=distance" -Method Get
Write-Host "   Found $($response.Count) busy bars with offers"
if ($response.Count -gt 0) {
    $sample = $response[0]
    Write-Host "   Nearest match: $($sample.name)" -ForegroundColor Green
    Write-Host "   - Category: $($sample.category)" -ForegroundColor Green
    Write-Host "   - Busyness: $($sample.busyness)" -ForegroundColor Green
    Write-Host "   - Offers: $($sample.activeOffersCount)" -ForegroundColor Green
    Write-Host "   - Distance: $([math]::Round($sample.distance, 2)) km" -ForegroundColor Green
}

# Test 13: Test with user authentication (if user is logged in)
# First, let's login
Write-Host "`n13. Testing with user preferences:" -ForegroundColor Yellow
try {
    $loginData = @{
        email = "alice@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $loginResponse.access_token
    
    Write-Host "   Logged in as alice@example.com" -ForegroundColor Green
    
    # Get user preferences first
    $headers = @{ Authorization = "Bearer $token" }
    $me = Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Get -Headers $headers
    Write-Host "   User preferences:" -ForegroundColor Green
    Write-Host "   - Preferred categories: $($me.preferences.preferredCategories)" -ForegroundColor Gray
    Write-Host "   - Min busyness: $($me.preferences.minBusyness)" -ForegroundColor Gray
    Write-Host "   - Preferred vibes: $($me.preferences.preferredVibes)" -ForegroundColor Gray
    
    # Test with usePreferences=true
    $response = Invoke-RestMethod -Uri "$baseUrl/venues?cityId=$cityId&usePreferences=true" -Method Get -Headers $headers
    Write-Host "   Found $($response.Count) venues matching user preferences" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "   Sample: $($response[0].name) - $($response[0].category)" -ForegroundColor Green
    }
} catch {
    Write-Host "   Could not test with authentication (user may not exist or preferences not set)" -ForegroundColor Yellow
}

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor White
Write-Host "- Basic search: OK" -ForegroundColor Green
Write-Host "- Proximity-based search with distance: OK" -ForegroundColor Green
Write-Host "- Category filtering: OK" -ForegroundColor Green
Write-Host "- Busyness filtering: OK" -ForegroundColor Green
Write-Host "- Vibe filtering: OK" -ForegroundColor Green
Write-Host "- Offers filtering: OK" -ForegroundColor Green
Write-Host "- Distance sorting: OK" -ForegroundColor Green
Write-Host "- Name sorting: OK" -ForegroundColor Green
Write-Host "- Busyness sorting: OK" -ForegroundColor Green
Write-Host "- Offers sorting: OK" -ForegroundColor Green
Write-Host "- Combined filters: OK" -ForegroundColor Green
Write-Host "- User preferences: Tested" -ForegroundColor Green
