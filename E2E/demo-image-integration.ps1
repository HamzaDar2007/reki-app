# Image Integration Demo Script
# Shows the completed image integration

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       REKI MVP - Image Integration Complete! 🎉         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "=== 1. DATABASE STATUS ===" -ForegroundColor Yellow
Write-Host ""
try {
    $venues = Invoke-RestMethod -Uri "http://localhost:3000/venues?cityId=3ff5e526-7819-45d5-9995-bd6db919c9b2" -Method Get
    
    Write-Host "✅ Total Venues in Manchester: $($venues.Count)" -ForegroundColor Green
    $withImages = ($venues | Where-Object { $_.imageUrl }).Count
    Write-Host "✅ Venues with Images: $withImages" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Category Breakdown:" -ForegroundColor Cyan
    $venues | Group-Object category | ForEach-Object {
        $categoryWithImages = ($_.Group | Where-Object { $_.imageUrl }).Count
        Write-Host "  • $($_.Name): $($_.Count) total, $categoryWithImages with images" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "=== 2. IMAGE SERVING ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Images are served at: http://localhost:3000/images/" -ForegroundColor Cyan
    Write-Host ""
    
    $testImages = @(
        "/images/bar/Cloud 23.jpg",
        "/images/casino/Admiral Casino.avif",
        "/images/restorantes/Dishoom.avif",
        "/images/restorantes/mana.webp"
    )
    
    Write-Host "Testing image accessibility:" -ForegroundColor Cyan
    foreach ($img in $testImages) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000$img" -Method Head -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✅ $img" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ❌ $img" -ForegroundColor Red
        }
    }
    Write-Host ""
    
    Write-Host "=== 3. NEW VENUES ADDED ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Bars:" -ForegroundColor Cyan
    $venues | Where-Object { $_.category -eq 'BAR' -and $_.imageUrl } | Select-Object -First 4 | ForEach-Object {
        Write-Host "  • $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "Casinos:" -ForegroundColor Cyan
    $venues | Where-Object { $_.category -eq 'CASINO' -and $_.imageUrl } | ForEach-Object {
        Write-Host "  • $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "Restaurants:" -ForegroundColor Cyan
    $venues | Where-Object { $_.category -eq 'RESTAURANT' -and $_.imageUrl } | ForEach-Object {
        Write-Host "  • $($_.name)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "=== 4. SAMPLE API RESPONSE ===" -ForegroundColor Yellow
    Write-Host ""
    $sampleVenue = $venues | Where-Object { $_.name -eq 'Cloud 23' } | Select-Object -First 1
    if ($sampleVenue) {
        Write-Host "Venue: $($sampleVenue.name)" -ForegroundColor Cyan
        Write-Host "  Category: $($sampleVenue.category)" -ForegroundColor White
        Write-Host "  Image URL: $($sampleVenue.imageUrl)" -ForegroundColor White
        Write-Host "  Address: $($sampleVenue.address)" -ForegroundColor White
        Write-Host "  Description: $($sampleVenue.description)" -ForegroundColor White
        Write-Host "  Busyness: $($sampleVenue.busyness)" -ForegroundColor White
        Write-Host "  Vibe: $($sampleVenue.vibe)" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "=== 5. WHAT WAS IMPLEMENTED ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ Installed @nestjs/serve-static package" -ForegroundColor Green
    Write-Host "✅ Configured static file serving at /images/ endpoint" -ForegroundColor Green
    Write-Host "✅ Added image_url, gallery_images, logo_url columns to venues table" -ForegroundColor Green
    Write-Host "✅ Added CASINO category to venue enum" -ForegroundColor Green
    Write-Host "✅ Created 14 new venues with images:" -ForegroundColor Green
    Write-Host "    • 4 Bars (Cloud 23, NQ64, Schofields Bar, The Edinburgh Castle)" -ForegroundColor White
    Write-Host "    • 5 Casinos (Admiral, Genting, Grosvenor, Manchester235, Napoleons)" -ForegroundColor White
    Write-Host "    • 5 Restaurants (20 Stories, Dishoom, Mana, Skof, The Black Friar)" -ForegroundColor White
    Write-Host "✅ Updated venue DTOs to include image fields" -ForegroundColor Green
    Write-Host "✅ Updated venues controller to return image URLs" -ForegroundColor Green
    Write-Host "✅ Created ImageHelper utility for smart name matching" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "=== 6. NEXT STEPS ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your iOS app can now:" -ForegroundColor Cyan
    Write-Host "  1. Display venue images in lists and detail views" -ForegroundColor White
    Write-Host "  2. Access images at: http://localhost:3000/images/..." -ForegroundColor White
    Write-Host "  3. Support multiple formats: .jpg, .jpeg, .png, .webp, .avif" -ForegroundColor White
    Write-Host "  4. Show gallery images (galleryImages array) for venues" -ForegroundColor White
    Write-Host "  5. Display logos (logoUrl field) where available" -ForegroundColor White
    Write-Host ""
    
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "         Image Integration Successfully Complete!" -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Error connecting to API: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the server is running: npm run start:dev" -ForegroundColor Yellow
}
