# Test All 20 Venue Images
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "       Testing All 20 Venue Images" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Fetch all venues
    $venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2" -Method Get
    
    Write-Host "DATABASE STATUS:" -ForegroundColor Yellow
    Write-Host "  Total Venues: $($venues.Count)" -ForegroundColor $(if ($venues.Count -eq 20) { "Green" } else { "Red" })
    Write-Host ""
    
    # Check that all venues have cover_image_url
    $withImages = ($venues | Where-Object { $_.coverImageUrl }).Count
    Write-Host "  Venues with coverImageUrl: $withImages / $($venues.Count)" -ForegroundColor  $(if ($withImages -eq 20) { "Green" } else { "Red" })
    Write-Host ""
    
    # Test image_url field should NOT exist
    $withOldField = ($venues | Where-Object { $null -ne $_.imageUrl }).Count
    if ($withOldField -eq 0) {
        Write-Host "  [OK] imageUrl field removed from API response" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] imageUrl field still in response" -ForegroundColor Yellow
    }
    Write-Host ""
    
    Write-Host "CATEGORY BREAKDOWN:" -ForegroundColor Yellow
    $venues | Group-Object category | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Count) venues" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "TESTING IMAGE ACCESSIBILITY:" -ForegroundColor Yellow
    Write-Host ""
    
    $successCount = 0
    $failedImages = @()
    
    foreach ($venue in $venues) {
        if ($venue.coverImageUrl) {
            $imageUrl = "http://localhost:3000$($venue.coverImageUrl)"
            try {
                $response = Invoke-WebRequest -Uri $imageUrl -Method Head -UseBasicParsing -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Host "  [OK] $($venue.name)" -ForegroundColor Green
                    $successCount++
                } else {
                    Write-Host "  [FAIL] $($venue.name) - Status: $($response.StatusCode)" -ForegroundColor Red
                    $failedImages += $venue.name
                }
            } catch {
                Write-Host "  [FAIL] $($venue.name) - $($_.Exception.Message)" -ForegroundColor Red
                $failedImages += $venue.name
            }
        } else {
            Write-Host "  [FAIL] $($venue.name) - No image URL" -ForegroundColor Red
            $failedImages += $venue.name
        }
    }
    
    Write-Host ""
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host "TEST RESULTS:" -ForegroundColor Yellow
    Write-Host "  Images Accessible: $successCount / $($venues.Count)" -ForegroundColor $(if ($successCount -eq 20) { "Green" } else { "Yellow" })
    
    if ($failedImages.Count -gt 0) {
        Write-Host ""
        Write-Host "Failed Images:" -ForegroundColor Red
        $failedImages | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    
    Write-Host ""
    if ($successCount -eq 20 -and $venues.Count -eq 20) {
        Write-Host "SUCCESS: All 20 venue images are working!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Some issues found. Check above for details." -ForegroundColor Yellow
    }
    Write-Host "=============================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Show sample URLs for browser testing
    Write-Host "SAMPLE URLS FOR BROWSER TESTING:" -ForegroundColor Yellow
    $venues | Select-Object -First 5 | ForEach-Object {
        Write-Host "  http://localhost:3000$($_.coverImageUrl)" -ForegroundColor Cyan
    }
    Write-Host ""
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure the server is running: npm run start:dev" -ForegroundColor Yellow
}
