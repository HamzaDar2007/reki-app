# Comprehensive Error Handling Implementation Guide

## Overview
This document details the comprehensive error handling system that has been added to your REKI NestJS API application.

## What Was Implemented

### 1. **Custom Exception Classes** 
📁 Location: [src/common/exceptions/custom-exceptions.ts](src/common/exceptions/custom-exceptions.ts)

Custom exception classes for domain-specific errors:

- **`ValidationException`** - For validation errors (400)
- **`ResourceNotFoundException`** - When resources aren't found (404)
- **`ResourceConflictException`** - For conflicts like duplicates (409)
- **`DatabaseException`** - For database operation failures (500)
- **`AuthenticationException`** - For auth failures (401)
- **`AuthorizationException`** - For permission denials (403)
- **`BusinessLogicException`** - For business rule violations (400)
- **`ExternalServiceException`** - When external services fail (503)
- **`InvalidParameterException`** - For invalid input parameters (400)
- **`RateLimitException`** - When rate limits are exceeded (429)
- **`TimeoutException`** - When operations timeout (504)

**Benefits:**
- Consistent error response format
- Type-safe exception handling
- Clear error semantics
- Easy to catch and handle specific errors

---

### 2. **Enhanced Global Exception Filter with Database Error Conversion**
📁 Location: [src/common/filters/global-exception.filter.ts](src/common/filters/global-exception.filter.ts)

Features:
- Catches **all unhandled exceptions**
- **NEW:** Detects and converts PostgreSQL database errors to user-friendly messages
- Logs errors with full context (path, method, user ID, IP)
- Differentiates between:
  - Server errors (5xx) - logged as errors
  - Client errors (4xx) - logged as warnings
- Development mode includes request path/method in response
- Timestamp tracking for error investigation

#### Database Error Conversion
The filter now automatically converts raw database constraint violations to user-friendly HTTP responses:

**PostgreSQL Error Codes Handled:**

| Error Code | Description | Response Status | User-Friendly Message |
|-----------|-------------|-----------------|----------------------|
| **23505** | Unique constraint violation | 409 CONFLICT | "{Field} already exists. Please use a different {field}." |
| **23503** | Foreign key constraint violation | 400 BAD_REQUEST | "Referenced resource does not exist. Please verify all IDs are correct." |
| **23502** | NOT NULL constraint violation | 400 BAD_REQUEST | "The {field} field is required." |
| **23514** | Check constraint violation | 400 BAD_REQUEST | "One or more fields contain invalid values." |
| **ECONNREFUSED** | Connection refused | 503 SERVICE_UNAVAILABLE | "Database connection failed. Please try again later." |
| **ENOTFOUND** | Host not found | 503 SERVICE_UNAVAILABLE | "Database connection failed. Please try again later." |
| **ETIMEDOUT** | Operation timeout | 504 GATEWAY_TIMEOUT | "Database operation timed out. Please try again." |
| **EHOSTUNREACH** | Host unreachable | 504 GATEWAY_TIMEOUT | "Database operation timed out. Please try again." |

**Example: Duplicate Email Registration**
```
REQUEST:
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123"
}

RESPONSE (409 CONFLICT):
{
  "statusCode": 409,
  "message": "Email already exists. Please use a different email.",
  "error": "ConflictError",
  "timestamp": "2025-02-18T10:30:45.123Z"
}
```

Before this fix, clients received:
```json
{
  "statusCode": 500,
  "message": "duplicate key value violates unique constraint \"UQ_97672ac88f789774dd47f7c8be3\"",
  "error": "InternalServerError"
}
```

**Conversion Methods:**
- `convertDatabaseError()` - Maps PostgreSQL codes to friendly messages and HTTP status codes
- `extractDatabaseError()` - Detects database errors within generic Error objects (fallback layer)

---

### 3. **Error Logging Service**
📁 Location: [src/common/services/error-logging.service.ts](src/common/services/error-logging.service.ts)

Centralized logging for:
- Application errors
- HTTP errors
- Database errors
- Warnings and info messages

**Methods:**
- `logError()` - Log application errors
- `logHttpError()` - Log HTTP request errors
- `logDatabaseError()` - Log database operation failures
- `logWarning()` - Log warnings
- `logInfo()` - Log informational messages

**Features:**
- Structured logging with metadata
- User ID tracking
- Request context tracking
- Stack trace capture
- Ready for external logging service integration

---

### 5.5. **Service-Level Pre-Validation**

Critical services now validate constraints **before** attempting database operations. This provides:
- Immediate, friendly error responses
- Prevention of raw database errors
- Better performance (fail fast)
- Clear error messages at the point of failure

**Updated Services with Pre-validation:**

#### [AuthService](src/modules/auth/auth.service.ts)
```typescript
async register(dto: RegisterDto) {
  // Pre-check for duplicate email BEFORE insert
  const existingUser = await this.userRepo.findOne({
    where: { email: dto.email },
  });
  
  if (existingUser) {
    throw new ConflictException(
      'Email already exists. Please use a different email address.'
    );
  }
  
  // Safe to insert now
  const user = await this.userRepo.save(newUser);
}
```

#### [UsersService](src/modules/users/users.service.ts)
- Validates email uniqueness before creating new user
- Returns `ConflictException` if email exists

#### [CitiesService](src/modules/cities/cities.service.ts)
- Validates duplicate city+country combination before insert
- Composite unique constraint: `['name', 'countryCode']`
- Returns `ConflictException` if city already exists

**Benefits of Pre-validation:**
1. **Fast-fail** - Errors caught before database call
2. **User-friendly** - Better error messages at service layer
3. **Logging** - Service can log business logic failures separately
4. **Testability** - Service logic can be unit tested without DB

**Fallback Protection:**
Even with pre-validation, the GlobalExceptionFilter converts any database errors that slip through to user-friendly messages.

---

### 5.6. **Database Error Handler**
📁 Location: [src/common/utils/database-error-handler.ts](src/common/utils/database-error-handler.ts)

Automatically converts database errors to appropriate exceptions:

**PostgreSQL Error Codes Handled:**
- **23505** - Unique constraint violation → `ResourceConflictException`
- **23503** - Foreign key violation → `InvalidParameterException`
- **23502** - NOT NULL constraint → `InvalidParameterException`
- **23514** - Check constraint → `InvalidParameterException`
- **ECONNREFUSED** - Connection failure → `DatabaseException`

**Usage:**
```typescript
try {
  await database.save(entity);
} catch (error) {
  DatabaseErrorHandler.handle(error, 'saving entity');
}
```

---

### 5. **Error Handling Interceptor**
📁 Location: [src/common/interceptors/error-handling.interceptor.ts](src/common/interceptors/error-handling.interceptor.ts)

Global error handling at the HTTP layer:
- Catches response errors
- Logs HTTP errors with metadata
- Handles specific error types (validation, timeout)
- Re-throws for exception filter processing

---

### 6. **Controller-Level Error Handling**
All controllers now have comprehensive error handling:

#### Updated Controllers:
- ✅ [AppController](src/app.controller.ts)
- ✅ [AuthController](src/modules/auth/auth.controller.ts)
- ✅ [UsersController](src/modules/users/users.controller.ts)
- ✅ [CitiesController](src/modules/cities/cities.controller.ts)
- ✅ [VenuesController](src/modules/venues/venues.controller.ts)
- ✅ [OffersController](src/modules/offers/offers.controller.ts)
- ✅ [NotificationsController](src/modules/notifications/notifications.controller.ts)
- ✅ [AutomationController](src/modules/automation/automation.controller.ts)
- ✅ [AnalyticsController](src/modules/analytics/analytics.controller.ts)
- ✅ [DemoController](src/modules/demo/demo.controller.ts)

#### Error Handling Pattern:
Every route handler follows this pattern:

```typescript
async methodName(@Param/Query/Body parameters) {
  try {
    // Validate inputs
    if (!requiredParam) {
      throw new BadRequestException('Parameter is required');
    }
    
    // Log operation
    this.logger.log(`Operation description`);
    
    // Execute business logic
    const result = await service.operation();
    
    // Return result
    return result;
  } catch (error) {
    // Catch specific errors for better handling
    if ((error as any)?.code === '23505' || (error as any)?.status === 409) {
      this.logger.warn(`Conflict error: ${error.message}`);
      throw new ConflictException('Resource already exists');
    }
    
    // Log error
    this.logger.error('Operation failed:', error);
    // Re-throw for global filter
    throw error;
  }
}
```

**Example: AuthController Register Route**
```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  try {
    // Input validation
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email and password are required');
    }
    if (dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    
    this.logger.log(`Registration attempt for email: ${dto.email}`);
    const result = await this.authService.register(dto);
    this.logger.log(`User registered successfully: ${dto.email}`);
    return result;
  } catch (error) {
    // Handle duplicate email with ConflictException
    if ((error as any)?.code === '23505' || (error as any)?.status === 409) {
      this.logger.warn(`Registration failed - duplicate email: ${dto.email}`);
      throw new ConflictException(
        'This email address is already registered. Please use a different email or try logging in.'
      );
    }
    
    this.logger.error(`Registration failed for ${dto.email}:`, error);
    throw error;
  }
}
```

#### Error Type Coverage:
- **Input Validation** - `BadRequestException` for invalid parameters
- **Authentication** - `UnauthorizedException` for missing/invalid tokens
- **Authorization** - `ForbiddenException` for permission denials
- **Not Found** - `NotFoundException` for missing resources
- **Conflicts** - `ConflictException` for duplicate resources (email, city, etc.)
- **Server Errors** - `InternalServerErrorException` for unexpected failures

---

### 7. **Enhanced main.ts**
📁 Location: [src/main.ts](src/main.ts)

Updated bootstrap configuration:
- Added error handling interceptor
- Global exception filter registration
- Proper error initialization

---

## Error Response Standard Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "ErrorType",
  "timestamp": "ISO-8601 timestamp",
  // Additional context fields based on error type
}
```

---

## Error Codes Used

| Code | Status | Handler | Example |
|------|--------|---------|---------|
| 400 | Bad Request | `BadRequestException` | Invalid parameters, validation errors |
| 401 | Unauthorized | `UnauthorizedException` | Invalid/missing token |
| 403 | Forbidden | `ForbiddenException` | Permission denied |
| 404 | Not Found | `NotFoundException` | Resource doesn't exist |
| 409 | Conflict | `ResourceConflictException` | Duplicate email, constraint violation |
| 500 | Server Error | `InternalServerErrorException` | Unexpected application errors |
| 503 | Service Unavailable | `ExternalServiceException` | External API failures |
| 504 | Gateway Timeout | `TimeoutException` | Operation timeouts |

---

## Logging System

### What Gets Logged:

**🔴 Error Level (5xx):**
- Unhandled exceptions
- Database failures
- Service crashes
- Critical business logic failures

**🟡 Warning Level (4xx):**
- Client errors
- Invalid requests
- Authorization failures
- Resource not found

**🟢 Info Level:**
- Successful operations
- Important business events
- Audit trail events

### Log Format:
```
[Context] Message
  - Error: Specific error message
  - Stack: Full stack trace
  - Metadata: Request context, user info, parameters
```

---

## Best Practices Implemented

### 1. **Input Validation**
Every endpoint validates required parameters:
```typescript
if (!param || param.trim() === '') {
  throw new BadRequestException('Parameter is required');
}
```

### 2. **Null Checks**
All operations check for null/undefined:
```typescript
const entity = await service.findById(id);
if (!entity) {
  throw new NotFoundException('Entity not found');
}
```

### 3. **Error Context**
Errors include relevant context:
```typescript
throw new NotFoundException(`User with ID ${id} not found`);
```

### 4. **Logging**
Every critical operation is logged:
```typescript
this.logger.log(`Creating user: ${email}`);
// ... operation ...
this.logger.error('Failed to create user:', error);
```

### 5. **Type Safety**
Use specific exception types rather than generic errors:
```typescript
// ❌ Bad
throw new Error('Not found');

// ✅ Good
throw new NotFoundException('User not found');
```

---

## Usage Examples

### Example 1: Handle Not Found Error
```typescript
try {
  const user = await this.usersService.findById(userId);
  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }
  return user;
} catch (error) {
  this.logger.error(`Failed to fetch user: ${userId}`, error);
  throw error; // Let global filter handle it
}
```

### Example 2: Handle Input Validation
```typescript
if (!email || !validator.isEmail(email)) {
  throw new BadRequestException('Valid email is required');
}
```

### Example 3: Handle Database Errors
```typescript
try {
  await repository.save(entity);
} catch (error) {
  DatabaseErrorHandler.handle(error, 'saving entity');
}
```

### Example 4: Handle Authorization
```typescript
if (user.role !== UserRole.ADMIN && entity.ownerId !== user.id) {
  throw new ForbiddenException('You do not own this resource');
}
```

---

## Testing Your Error Handling

### 1. Test Invalid Parameters
```bash
curl -X GET http://localhost:3000/users/invalid-id \
  -H "Authorization: Bearer token"
```

### 2. Test Missing Authentication
```bash
curl -X GET http://localhost:3000/users
```

### 3. Test Permission Denied
```bash
curl -X PATCH http://localhost:3000/venues/other-users-venue \
  -H "Authorization: Bearer your-token"
```

### 4. Test Invalid Input
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}'
```

---

## Future Enhancements

### 1. **External Logging Service**
Integrate with services like:
- Sentry
- LogRocket
- CloudWatch
- Datadog

### 2. **Error Analytics**
Track error patterns:
- Most common errors
- Error trends over time
- User impact analysis

### 3. **Retry Logic**
Implement automatic retries for:
- Network timeouts
- Temporary service failures
- Database connection issues

### 4. **Rate Limiting**
Implement rate limit error handling:
- Track request rates per user
- Return `429 Too Many Requests`
- Implement backoff strategies

### 5. **Custom Error Pages**
Create user-friendly error pages for:
- 404 errors
- 500 errors
- Maintenance mode

---

## Troubleshooting

### Problem: Errors not being logged
**Solution:** Check that `ErrorLoggingService` is provided in module:
```typescript
@Module({
  providers: [ErrorLoggingService, your-service],
})
```

### Problem: Global filter not catching errors
**Solution:** Ensure it's registered in main.ts:
```typescript
app.useGlobalFilters(new GlobalExceptionFilter());
```

### Problem: Database errors not converting
**Solution:** Use `DatabaseErrorHandler.handle()`:
```typescript
try {
  await db.save(entity);
} catch (error) {
  DatabaseErrorHandler.handle(error, 'operation name');
}
```

---

## Summary

Your API now has:
- ✅ 11 custom exception types
- ✅ Enhanced global exception filter
- ✅ Centralized error logging
- ✅ Database error conversion
- ✅ Error handling interceptor
- ✅ Comprehensive controller error handling
- ✅ Structured error responses
- ✅ Full request/response logging
- ✅ Type-safe error handling

All routes now handle errors gracefully and return consistent, informative error responses!
