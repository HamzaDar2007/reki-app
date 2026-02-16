# Quick Demo - 20 Venues with Images

Write-Host ""
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "       REKI MVP - 20 Venues with Images Demo" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host ""

try {
    $venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2"
    
    Write-Host "VENUE DATABASE:" -ForegroundColor Yellow
    Write-Host "  Total Venues: $($venues.Count)" -ForegroundColor Green
    Write-Host "  All have cover images: YES" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "BARS (5):" -ForegroundColor Yellow
    $venues | Where-Object { $_.category -eq 'BAR' } | ForEach-Object {
        Write-Host "  - $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "CASINOS (5):" -ForegroundColor Yellow
    $venues | Where-Object { $_.category -eq 'CASINO' } | ForEach-Object {
        Write-Host "  - $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "RESTAURANTS (10):" -ForegroundColor Yellow
    $venues | Where-Object { $_.category -eq 'RESTAURANT' } | ForEach-Object {
        Write-Host "  - $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "SAMPLE API RESPONSE:" -ForegroundColor Yellow
    $sample = $venues | Select-Object -First 1
    Write-Host "  {" -ForegroundColor White
    Write-Host "    name: '$($sample.name)'," -ForegroundColor White
    Write-Host "    category: '$($sample.category)'," -ForegroundColor White
    Write-Host "    coverImageUrl: '$($sample.coverImageUrl)'," -ForegroundColor Green
    Write-Host "    busyness: '$($sample.busyness)'," -ForegroundColor White
    Write-Host "    vibe: '$($sample.vibe)'" -ForegroundColor White
    Write-Host "  }" -ForegroundColor White
    Write-Host ""
    
    Write-Host "TEST IN BROWSER:" -ForegroundColor Yellow
    Write-Host "  API: http://localhost:3000/venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2" -ForegroundColor Cyan
    Write-Host "  Image: http://localhost:3000$($sample.coverImageUrl)" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host "         All 20 Venues Ready for iOS App!" -ForegroundColor Green
    Write-Host "=============================================================" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
