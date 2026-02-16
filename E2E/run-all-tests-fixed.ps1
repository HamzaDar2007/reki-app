# REKI MVP - Master Test Runner (Fixed Version)
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                REKI MVP - COMPLETE TEST SUITE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testResults = @()

# Function to run test and capture result
function Run-Test {
    param($TestName, $ScriptPath)
    
    Write-Host "🧪 Running: $TestName" -ForegroundColor Yellow
    try {
        if (Test-Path $ScriptPath) {
            & $ScriptPath
            $testResults += @{ Name = $TestName; Status = "PASSED"; Error = $null }
            Write-Host "✅ $TestName - PASSED" -ForegroundColor Green
        } else {
            Write-Host "❌ Script not found: $ScriptPath" -ForegroundColor Red
            $testResults += @{ Name = $TestName; Status = "FAILED"; Error = "Script not found" }
        }
    } catch {
        Write-Host "❌ $TestName - FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Name = $TestName; Status = "FAILED"; Error = $_.Exception.Message }
    }
    Write-Host ""
}

# Check server availability
Write-Host "🔍 Checking server availability..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/cities" -Method GET -TimeoutSec 5
    Write-Host "✅ Server is running and responsive" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not accessible at $baseUrl" -ForegroundColor Red
    Write-Host "   Please start the server with: npm run start:dev" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Run all tests
Write-Host "🚀 Starting test execution..." -ForegroundColor Cyan
Write-Host ""

# 1. Setup and Discovery Tests
Run-Test "Setup Discovery Test" ".\E2E\setup-discovery-test-fixed.ps1"

# 2. Venue Management Tests  
Run-Test "Venue Management Tests" ".\E2E\test-venues-working.ps1"

# 3. User Journey Demo
Run-Test "User Journey Demo" ".\E2E\demo-user-journey-fixed.ps1"

# 4. Image System Tests
Run-Test "Image System Tests" ".\E2E\test-all-20-images.ps1"

# 5. Additional Core Tests
$additionalTests = @(
    @{ Name = "Analytics Tests"; Script = ".\E2E\test-analytics.ps1" },
    @{ Name = "Notifications Tests"; Script = ".\E2E\test-notifications.ps1" },
    @{ Name = "Users Tests"; Script = ".\E2E\test-users.ps1" }
)

foreach ($test in $additionalTests) {
    Run-Test $test.Name $test.Script
}

# Test Summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                        TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$passed = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$total = $testResults.Count

Write-Host "📊 Results:" -ForegroundColor Yellow
Write-Host "   Total Tests: $total" -ForegroundColor White
Write-Host "   Passed: $passed" -ForegroundColor Green
Write-Host "   Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "❌ Failed Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -eq "FAILED" } | ForEach-Object {
        Write-Host "   - $($_.Name): $($_.Error)" -ForegroundColor Red
    }
    Write-Host ""
}

# Overall Status
if ($failed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! REKI MVP is ready for demo." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Please review and fix issues above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    TEST EXECUTION COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""