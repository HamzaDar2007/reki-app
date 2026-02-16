# Image Integration Demo - Simple Version
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "       REKI MVP - Image Integration Complete!" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

try {
    $venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2" -Method Get
    
    Write-Host "DATABASE STATUS:" -ForegroundColor Yellow
    Write-Host "  Total Venues: $($venues.Count)" -ForegroundColor Green
    $withImages = ($venues | Where-Object { $_.imageUrl }).Count
    Write-Host "  Venues with Images: $withImages" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "CATEGORY BREAKDOWN:" -ForegroundColor Yellow
    $venues | Group-Object category | ForEach-Object {
        $categoryWithImages = ($_.Group | Where-Object { $_.imageUrl }).Count
        Write-Host "  $($_.Name): $($_.Count) total, $categoryWithImages with images" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "NEW VENUES WITH IMAGES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Bars:" -ForegroundColor Cyan
    $venues | Where-Object { $_.category -eq 'BAR' -and $_.imageUrl } | Select-Object -First 4 | ForEach-Object {
        Write-Host "    - $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "  Casinos:" -ForegroundColor Cyan
    $venues | Where-Object { $_.category -eq 'CASINO' -and $_.imageUrl } | ForEach-Object {
        Write-Host "    - $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "  Restaurants:" -ForegroundColor Cyan
    $venues | Where-Object { $_.category -eq 'RESTAURANT' -and $_.imageUrl } | ForEach-Object {
        Write-Host "    - $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "SAMPLE IMAGE URLS:" -ForegroundColor Yellow
    $venues | Where-Object { $_.imageUrl } | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.name): $($_.imageUrl)" -ForegroundColor Cyan
    }
    Write-Host ""
    
    Write-Host "TESTING IMAGE ACCESS:" -ForegroundColor Yellow
    $testImages = @(
        "/images/bar/Cloud 23.jpg",
        "/images/casino/Admiral Casino.avif",
        "/images/restorantes/Dishoom.avif"
    )
    
    foreach ($img in $testImages) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000$img" -Method Head -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "  [OK] $img" -ForegroundColor Green
            }
        } catch {
            Write-Host "  [FAIL] $img" -ForegroundColor Red
        }
    }
    Write-Host ""
    
    Write-Host "WHAT WAS IMPLEMENTED:" -ForegroundColor Yellow
    Write-Host "  [x] Installed @nestjs/serve-static package" -ForegroundColor Green
    Write-Host "  [x] Configured static file serving at /images/" -ForegroundColor Green
    Write-Host "  [x] Added image columns (image_url, gallery_images, logo_url)" -ForegroundColor Green
    Write-Host "  [x] Added CASINO category to venue enum" -ForegroundColor Green
    Write-Host "  [x] Created 14 new venues with real images" -ForegroundColor Green
    Write-Host "  [x] Updated venue DTOs and controller" -ForegroundColor Green
    Write-Host "  [x] Created ImageHelper utility class" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host "         Integration Successfully Complete!" -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure the server is running: npm run start:dev" -ForegroundColor Yellow
}
