# Test Venue Images Integration
# This script verifies that images are properly served and linked to venues

Write-Host "=== Testing Venue Images Integration ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if images are accessible via HTTP
Write-Host "Test 1: Checking image accessibility..." -ForegroundColor Yellow
$testImages = @(
    "http://localhost:3000/images/bar/Albert's Schloss.jpg",
    "http://localhost:3000/images/bar/Cloud 23.jpg",
    "http://localhost:3000/images/bar/NQ64.jpg",
    "http://localhost:3000/images/casino/Genting Casino Manchester.jpg",
    "http://localhost:3000/images/restorantes/Dishoom.avif"
)

$imageSuccess = 0
foreach ($imageUrl in $testImages) {
    try {
        $response = Invoke-WebRequest -Uri $imageUrl -Method Head -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ $imageUrl" -ForegroundColor Green
            $imageSuccess++
        }
    } catch {
        Write-Host "  ❌ $imageUrl - Not accessible" -ForegroundColor Red
    }
}
Write-Host "  Images accessible: $imageSuccess / $($testImages.Count)" -ForegroundColor Cyan
Write-Host ""

# Test 2: Check venues API for image URLs
Write-Host "Test 2: Checking venues API for image URLs..." -ForegroundColor Yellow
try {
    $venuesResponse = Invoke-RestMethod -Uri "http://localhost:3000/venues" -Method Get
    $venuesWithImages = ($venuesResponse | Where-Object { $_.imageUrl -ne $null }).Count
    $totalVenues = $venuesResponse.Count
    
    Write-Host "  Total venues: $totalVenues" -ForegroundColor Cyan
    Write-Host "  Venues with images: $venuesWithImages" -ForegroundColor Green
    
    # Show first 5 venues with images
    Write-Host ""
    Write-Host "  Sample venues with images:" -ForegroundColor Cyan
    $venuesResponse | Where-Object { $_.imageUrl -ne $null } | Select-Object -First 5 | ForEach-Object {
        Write-Host "    - $($_.name): $($_.imageUrl)" -ForegroundColor White
    }
} catch {
    Write-Host "  ❌ Failed to fetch venues API" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Check specific venue with image
Write-Host "Test 3: Checking specific venue details..." -ForegroundColor Yellow
try {
    $venues = Invoke-RestMethod -Uri "http://localhost:3000/venues" -Method Get
    $cloudVenue = $venues | Where-Object { $_.name -like "*Cloud 23*" } | Select-Object -First 1
    
    if ($cloudVenue) {
        Write-Host "  Found: $($cloudVenue.name)" -ForegroundColor Green
        Write-Host "    Category: $($cloudVenue.category)" -ForegroundColor Cyan
        Write-Host "    Image URL: $($cloudVenue.imageUrl)" -ForegroundColor Cyan
        Write-Host "    Cover Image: $($cloudVenue.coverImageUrl)" -ForegroundColor Cyan
        Write-Host "    Gallery Images: $($cloudVenue.galleryImages -join ', ')" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️  Cloud 23 venue not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Failed to fetch venue details" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
