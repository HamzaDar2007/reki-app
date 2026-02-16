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
.\E2E\setup-discovery-test.ps1

# Run venue discovery tests
.\E2E\test-discovery.ps1

# Test venue management
.\E2E\test-venues.ps1
```

### 5. Image Integration Tests
```bash
# Test venue images (20 venues)
.\E2E\test-all-20-images.ps1

# Test venue image functionality
.\E2E\test-venue-images.ps1
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
.\E2E\demo-user-journey.ps1
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

### Venue Setup Demos
```bash
# Setup 20 venues with images
.\E2E\demo-20-venues.ps1

# Simple image integration demo
.\E2E\demo-images-simple.ps1

# Advanced image integration demo
.\E2E\demo-image-integration.ps1
```

### Key Metrics Demo
```bash
# Show key business metrics
.\E2E\demo-key-metrics.ps1
```

## Running All Tests (Step by Step)

### Step 1: Environment Setup
```bash
# Start database
# Start API server
npm run start:dev
```

### Step 2: Core Tests
```bash
npm run test:e2e
```

### Step 3: API Tests (in order)
```bash
.\E2E\test-users.ps1
.\E2E\test-password-reset.ps1
.\E2E\setup-discovery-test.ps1
.\E2E\test-discovery.ps1
.\E2E\test-venues.ps1
```

### Step 4: Feature Tests
```bash
.\E2E\test-notifications.ps1
.\E2E\test-analytics.ps1
.\E2E\test-automation.ps1
```

### Step 5: Image Tests
```bash
.\E2E\test-venue-images.ps1
.\E2E\test-all-20-images.ps1
```

### Step 6: Demo Validation
```bash
.\E2E\demo-user-journey.ps1
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