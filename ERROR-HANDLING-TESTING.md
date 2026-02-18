# Error Handling Testing Guide

## Overview
This document provides test scenarios to verify that error handling is working correctly across the REKI API.

---

## Test Scenarios

### 1. **Duplicate Email Registration Error (23505 Unique Constraint)**

**Endpoint:** `POST /auth/register`

**Test Case:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response (First Call - Success):**
```json
HTTP 201 Created
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "...": "..."
  },
  "access_token": "jwt-token",
  "refresh_token": "jwt-token"
}
```

**Expected Response (Second Call with Same Email - Conflict):**
```json
HTTP 409 Conflict
{
  "statusCode": 409,
  "message": "Email already exists. Please use a different email.",
  "error": "ConflictError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

**Error Flow:**
1. Controller receives request
2. Service pre-checks for existing user with `findOne({email})`
3. Service throws `ConflictException` with friendly message
4. GlobalExceptionFilter catches it and formats response
5. Status 409 is returned to client

---

### 2. **Invalid City ID Foreign Key Error (23503)**

**Endpoint:** `POST /venues`

**Test Case:**
```json
{
  "name": "Test Venue",
  "cityId": "00000000-0000-0000-0000-000000000000",
  "category": "BAR",
  "address": "123 Main St"
}
```

**Expected Response (City Doesn't Exist):**
```json
HTTP 400 Bad Request
{
  "statusCode": 400,
  "message": "City with ID \"00000000-0000-0000-0000-000000000000\" does not exist or is inactive",
  "error": "BadRequestError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

**Error Flow:**
1. Controller receives request
2. Service pre-validates city existence with `findOne({cityId})`
3. Service throws `BadRequestException` if city not found
4. GlobalExceptionFilter catches it and formats response
5. Status 400 is returned to client

**Alternative Flow (if validation missed):**
1. If validation is bypassed, database FK error (23503) occurs
2. GlobalExceptionFilter catches `QueryFailedError` with code 23503
3. Converts to: "Referenced resource does not exist. Please verify all IDs are correct."
4. Status 400 is returned to client

---

### 3. **Duplicate City Name + Country Composite Unique Constraint (23505)**

**Endpoint:** `POST /cities`

**Test Case:**
```json
{
  "name": "Manchester",
  "countryCode": "GB"
}
```

**Expected Response (First Call - Success):**
```json
HTTP 201 Created
{
  "id": "uuid-here",
  "name": "Manchester",
  "countryCode": "GB",
  "timezone": "Europe/London",
  "isActive": true
}
```

**Expected Response (Second Call - Duplicate):**
```json
HTTP 409 Conflict
{
  "statusCode": 409,
  "message": "City \"Manchester\" in GB already exists",
  "error": "ConflictError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

**Error Flow:**
1. Controller receives request
2. Service pre-checks for existing city with composite key
3. Service throws `ConflictException` if city exists
4. GlobalExceptionFilter catches it and formats response
5. Status 409 is returned to client

---

### 4. **Database Connection Error**

**Scenario:** Database service is down or unreachable

**Expected Response:**
```json
HTTP 503 Service Unavailable
{
  "statusCode": 503,
  "message": "Database connection failed. Please try again later.",
  "error": "DatabaseConnectionError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

**Error Codes Detected:**
- `ECONNREFUSED` - Connection refused
- `ENOTFOUND` - Host not found

---

### 5. **Database Operation Timeout**

**Scenario:** Database query takes too long and times out

**Expected Response:**
```json
HTTP 504 Gateway Timeout
{
  "statusCode": 504,
  "message": "Database operation timed out. Please try again.",
  "error": "TimeoutError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

**Error Codes Detected:**
- `ETIMEDOUT` - Operation timeout
- `EHOSTUNREACH` - Host unreachable

---

### 6. **Input Validation Error**

**Endpoint:** `POST /auth/register`

**Test Case (Missing Email):**
```json
{
  "password": "password123"
}
```

**Expected Response:**
```json
HTTP 400 Bad Request
{
  "statusCode": 400,
  "message": "Email and password are required",
  "error": "BadRequestError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

**Error Flow:**
1. Controller validates input before calling service
2. Throws `BadRequestException` for missing fields
3. GlobalExceptionFilter catches and formats
4. Status 400 is returned to client

---

### 7. **Password Too Short**

**Endpoint:** `POST /auth/register`

**Test Case:**
```json
{
  "email": "test@example.com",
  "password": "123"
}
```

**Expected Response:**
```json
HTTP 400 Bad Request
{
  "statusCode": 400,
  "message": "Password must be at least 6 characters long",
  "error": "BadRequestError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

---

### 8. **Invalid Date Range for Offer**

**Endpoint:** `POST /offers`

**Test Case:**
```json
{
  "title": "Happy Hour",
  "venueId": "valid-uuid",
  "startsAt": "2025-03-01T20:00:00Z",
  "endsAt": "2025-02-01T22:00:00Z",
  "offerType": "PERCENT_OFF",
  "discountPercent": 20
}
```

**Expected Response:**
```json
HTTP 400 Bad Request
{
  "statusCode": 400,
  "message": "Start date must be before end date",
  "error": "BadRequestError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

---

## Testing Steps

### 1. Start the Development Server
```bash
npm run start:dev
```

### 2. Run Manual Tests
Use Postman or the test files in `/E2E` directory:
```bash
npm run test:e2e
```

### 3. Check Logs
Monitor the application logs for:
- Error messages at service level (pre-validation)
- Error messages at filter level (fallback)
- User IDs and request context

### 4. Verify Response Format
Ensure responses include:
- ✅ `statusCode` - HTTP status number
- ✅ `message` - User-friendly error message
- ✅ `error` - Error type (ConflictError, BadRequestError, etc.)
- ✅ `timestamp` - ISO 8601 formatted timestamp

---

## Error Handling Architecture

```
Request → Controller
           ↓
      Input Validation
           ↓
    BadRequestException? → GlobalExceptionFilter
           ↓
      Service Method
           ↓
      Pre-validation (check for duplicates, FK, etc.)
                            ↓
                    ConflictException / BadRequestException
                            ↓
           GlobalExceptionFilter (formats response)
           ↓
      Database Operation
           ↓
      QueryFailedError? → GlobalExceptionFilter
                            ↓
                    convertDatabaseError()
                            ↓
           User-friendly message + HTTP status
           ↓
      HTTP Response (JSON)
```

---

## Error Messages by Status Code

### 400 Bad Request
- Missing required fields
- Invalid input values
- Invalid date ranges
- Referenced resource doesn't exist
- Invalid field values (check constraints)

### 401 Unauthorized
- Missing authentication token
- Invalid token
- Expired token

### 403 Forbidden
- User lacks required roles/permissions
- Venue ownership check fails

### 404 Not Found
- Resource not found in database
- Entity deleted before operation

### 409 Conflict
- Duplicate email in registration
- Duplicate city (with country code)
- Duplicate resource with unique constraint

### 500 Internal Server Error
- Unexpected application errors
- Unhandled exceptions

### 503 Service Unavailable
- Database connection failure
- External service unreachable

### 504 Gateway Timeout
- Database operation timeout
- Network timeout

---

## Logging

All errors are logged with context:
- Error message
- Stack trace (in development)
- User ID (if authenticated)
- Request path and method
- Request IP address

Logs are sent to the ErrorLoggingService for centralized tracking.

---

## Best Practices for Adding New Endpoints

When adding new routes that interact with the database:

1. **Add pre-validation in the service**
   ```typescript
   // Check for duplicates/FK before insert
   const existing = await repo.findOne({where: {uniqueField: value}});
   if (existing) throw new ConflictException('...');
   ```

2. **Wrap in try-catch at service level**
   ```typescript
   try {
     const result = await repo.save(entity);
     this.logger.log('Success message');
     return result;
   } catch (error) {
     this.logger.error('Error message', error);
     throw error;
   }
   ```

3. **Add error handling in controller**
   ```typescript
   try {
     // Input validation
     // Call service
     // Return result
   } catch (error) {
     // Log if needed
     throw error; // Let filter handle
   }
   ```

4. **Trust the GlobalExceptionFilter**
   - Don't manually format responses
   - Let the filter handle exceptions
   - It will convert DB errors automatically

---

## Monitoring

Monitor these metrics to track error handling effectiveness:

1. **Duplicate Registration Attempts**
   - Count of 409 responses on /auth/register
   - Indicates user trying with existing email

2. **Invalid FK References**
   - Count of 400 responses on venue/offer creation
   - Indicates data quality issues

3. **Database Connection Errors**
   - Count of 503 responses
   - Indicates database availability issues

4. **Request Success Rate**
   - Count of 2xx responses vs all responses
   - Overall API health metric

