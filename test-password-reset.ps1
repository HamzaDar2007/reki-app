$baseUrl = "http://localhost:3000"

Write-Host "`n=== Testing Password Reset Email ===" -ForegroundColor Cyan

# Test with existing user email
$email = "user@example.com"

Write-Host "`nSending password reset request for: $email" -ForegroundColor Yellow

$body = @{
    email = $email
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" -Method Post -Body $body -ContentType "application/json"

Write-Host "Response: $($response.message)" -ForegroundColor Green
Write-Host "`nCheck your email inbox for the reset token!" -ForegroundColor Cyan
Write-Host "Also check server console logs for confirmation." -ForegroundColor Gray
