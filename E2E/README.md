# REKI E2E Testing Guide

## Prerequisites
1. **Database Setup**: Ensure PostgreSQL is running and database is migrated
2. **Server Running**: Start the API server with `npm run start:dev`
3. **Environment**: Verify `.env` file is configured correctly

## Test Categories

### 1. Core API Tests (Jest)
```bash
# Run Jest E2E tests
npm run test:e2e
```
**Files**: `app.e2e-spec.ts`, `reki-demo.e2e-spec.ts`

### 2. User Management Tests
```bash
# Test user registration, login, preferences
.\E2E\test-users.ps1
```

### 3. Authentication Tests
```bash
# Test password reset functionality
.\E2E\test-password-reset.ps1
```

### 4. Venue Discovery Tests
```bash
# Setup test data first
.\E2E\setup-discovery-test-fixed.ps1

# Run venue discovery tests
.\E2E\test-discovery.ps1

# Test venue management
.\E2E\test-venues-working.ps1
```

### 5. Image Integration Tests
```bash
# Test all 20 venue images
.\E2E\test-all-20-images.ps1
```

### 6. Notification Tests
```bash
# Test push notifications and email
.\E2E\test-notifications.ps1
```

### 7. Analytics Tests
```bash
# Test analytics and metrics
.\E2E\test-analytics.ps1
```

### 8. Automation Tests
```bash
# Test automated venue state changes
.\E2E\test-automation.ps1
```

## Demo Scripts

### Business Demo
```bash
# Complete business journey demo
.\E2E\demo-business-journey.ps1
```

### User Demo
```bash
# Complete user journey demo
.\E2E\demo-user-journey-fixed.ps1
```

### Investor Demo
```bash
# Complete investor presentation demo
.\E2E\demo-investor-complete.ps1
```

### Automation Demo
```bash
# Show automated features
.\E2E\demo-automation.ps1
```

### Venue Demo
```bash
# Show all 20 venues with images
.\E2E\demo-20-venues.ps1
```

### Key Metrics Demo
```bash
# Show key business metrics
.\E2E\demo-key-metrics.ps1
```

## Running All Tests

### Quick Run (All Tests)
```bash
# Run all tests at once
.\E2E\run-all-tests-fixed.ps1
```

### Manual Run (Step by Step)

#### Step 1: Environment Setup
```bash
# Start database
# Start API server
npm run start:dev
```

#### Step 2: Core Module Tests
```bash
.\E2E\test-users.ps1
.\E2E\test-venues-working.ps1
.\E2E\test-discovery.ps1
```

#### Step 3: Feature Tests
```bash
.\E2E\test-notifications.ps1
.\E2E\test-analytics.ps1
.\E2E\test-automation.ps1
.\E2E\test-password-reset.ps1
```

#### Step 4: Image Tests
```bash
.\E2E\test-all-20-images.ps1
```

#### Step 5: Demo Validation
```bash
.\E2E\demo-user-journey-fixed.ps1
.\E2E\demo-business-journey.ps1
.\E2E\demo-investor-complete.ps1
```

## Test Results
- ✅ **Pass**: Test completed successfully
- ❌ **Fail**: Check server logs and database state
- ⚠️ **Warning**: Partial success, review output

## Troubleshooting
1. **Connection errors**: Check if API server is running on port 3000
2. **Database errors**: Verify PostgreSQL is running and migrations are applied
3. **Authentication errors**: Ensure JWT tokens are valid
4. **Image errors**: Check if image files exist in public directory

## Notes
- Tests modify database state - run against test database
- Some tests depend on previous test data
- Demo scripts are safe to run multiple times
- PowerShell scripts require execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`