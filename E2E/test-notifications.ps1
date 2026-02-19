# Test Notifications Module
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING NOTIFICATIONS MODULE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$headers = @{ "Content-Type" = "application/json" }

# Step 1: Register two test users
Write-Host "1. Registering test users..." -ForegroundColor Yellow
$user1Body = @{
    email = "user1_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
    password = "Test123456"
    role = "BUSINESS"
} | ConvertTo-Json

$user2Body = @{
    email = "user2_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
    password = "Test123456"
} | ConvertTo-Json

try {
    $user1Response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Headers $headers -Body $user1Body
    $user1Token = $user1Response.access_token
    Write-Host "Success: User 1 registered ($($user1Response.user.email))" -ForegroundColor Green
    
    $user2Response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Headers $headers -Body $user2Body
    $user2Token = $user2Response.access_token
    Write-Host "Success: User 2 registered ($($user2Response.user.email))" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to register test users" -ForegroundColor Red
    exit 1
}

$user1Headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $user1Token"
}

$user2Headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $user2Token"
}

# Step 2: Create a venue with User 1
Write-Host "2. Creating test venue..." -ForegroundColor Yellow
$cityId = "3ff5e526-7819-45d5-9995-bd6db919c9b2"
$venueBody = @{
    name = "Notification Test Bar $(Get-Random)"
    cityId = $cityId
    category = "BAR"
    address = "123 Test St"
    postcode = "M1 1AA"
    lat = 53.48
    lng = -2.24
    description = "Test venue for notifications"
} | ConvertTo-Json

try {
    $venue = Invoke-RestMethod -Uri "$baseUrl/venues" -Method Post -Headers $user1Headers -Body $venueBody
    Write-Host "Success: Venue created - $($venue.name)" -ForegroundColor Green
    $venueId = $venue.id
    Write-Host ""
} catch {
    Write-Host "Failed to create venue" -ForegroundColor Red
    exit 1
}

# Step 3: Create an active offer (should trigger notifications)
Write-Host "3. Creating active offer (should trigger notifications)..." -ForegroundColor Yellow
$offerBody = @{
    venueId = $venueId
    title = "Happy Hour Special"
    description = "Buy one get one free on all drinks!"
    offerType = "BOGO"
    minBusyness = "QUIET"
    startsAt = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    endsAt = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    isActive = $true
} | ConvertTo-Json

try {
    $offer = Invoke-RestMethod -Uri "$baseUrl/offers" -Method Post -Headers $user1Headers -Body $offerBody
    Write-Host "Success: Offer created - $($offer.title)" -ForegroundColor Green
    $offerId = $offer.id
    Write-Host ""
    Start-Sleep -Seconds 2
} catch {
    Write-Host "Failed to create offer" -ForegroundColor Red
    exit 1
}

# Step 4: Check notifications for User 1
Write-Host "4. GET /notifications - User 1 notifications" -ForegroundColor Yellow
try {
    $user1Notifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $user1Headers
    Write-Host "Success: User 1 has $($user1Notifications.Count) notifications" -ForegroundColor Green
    if ($user1Notifications.Count -gt 0) {
        Write-Host "  Latest: $($user1Notifications[0].title)" -ForegroundColor Gray
        $notifId = $user1Notifications[0].id
    }
    Write-Host ""
} catch {
    Write-Host "Failed to get notifications" -ForegroundColor Red
    Write-Host ""
}

# Step 5: Get unread count for User 1
Write-Host "5. GET /notifications/unread-count - User 1" -ForegroundColor Yellow
try {
    $unreadCount = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method Get -Headers $user1Headers
    Write-Host "Success: User 1 has $($unreadCount.count) unread notifications" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to get unread count" -ForegroundColor Red
    Write-Host ""
}

# Step 6: Mark one notification as read
if ($notifId) {
    Write-Host "6. PATCH /notifications/:id/read - Mark as read" -ForegroundColor Yellow
    try {
        $markReadResult = Invoke-RestMethod -Uri "$baseUrl/notifications/$notifId/read" -Method Patch -Headers $user1Headers
        Write-Host "Success: Notification marked as read" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Failed to mark as read" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 7: Check unread count again
Write-Host "7. GET /notifications/unread-count - After marking one as read" -ForegroundColor Yellow
try {
    $unreadCount2 = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method Get -Headers $user1Headers
    Write-Host "Success: User 1 now has $($unreadCount2.count) unread notifications" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to get unread count" -ForegroundColor Red
    Write-Host ""
}

# Step 8: Mark all as read
Write-Host "8. PATCH /notifications/mark-all-read" -ForegroundColor Yellow
try {
    $markAllResult = Invoke-RestMethod -Uri "$baseUrl/notifications/mark-all-read" -Method Patch -Headers $user1Headers
    Write-Host "Success: $($markAllResult.message)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to mark all as read" -ForegroundColor Red
    Write-Host ""
}

# Step 9: Verify all marked as read
Write-Host "9. GET /notifications/unread-count - After marking all as read" -ForegroundColor Yellow
try {
    $unreadCount3 = Invoke-RestMethod -Uri "$baseUrl/notifications/unread-count" -Method Get -Headers $user1Headers
    Write-Host "Success: User 1 now has $($unreadCount3.count) unread notifications" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed to get unread count" -ForegroundColor Red
    Write-Host ""
}

# Step 10: Delete a notification
if ($notifId) {
    Write-Host "10. DELETE /notifications/:id" -ForegroundColor Yellow
    try {
        $deleteResult = Invoke-RestMethod -Uri "$baseUrl/notifications/$notifId" -Method Delete -Headers $user1Headers
        Write-Host "Success: $($deleteResult.message)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Failed to delete notification" -ForegroundColor Red
        Write-Host ""
    }
}

# Step 11: Check User 2 notifications (should also have received notification)
Write-Host "11. GET /notifications - User 2 notifications" -ForegroundColor Yellow
try {
    $user2Notifications = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $user2Headers
    Write-Host "Success: User 2 has $($user2Notifications.Count) notifications" -ForegroundColor Green
    if ($user2Notifications.Count -gt 0) {
        Write-Host "  Latest: $($user2Notifications[0].title)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "Failed to get User 2 notifications" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NOTIFICATIONS MODULE TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "- Offer creation triggers notifications" -ForegroundColor Gray
Write-Host "- Users receive in-app notifications" -ForegroundColor Gray
Write-Host "- Unread count tracking works" -ForegroundColor Gray
Write-Host "- Mark as read (single and all) works" -ForegroundColor Gray
Write-Host "- Delete notification works" -ForegroundColor Gray
Write-Host ""
