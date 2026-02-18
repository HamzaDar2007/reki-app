import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for validation errors
 */
export class ValidationException extends HttpException {
  constructor(message: string, errors?: Record<string, any>) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'ValidationError',
        errors,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Custom exception for resource not found errors
 */
export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `${resource} with identifier "${identifier}" not found`,
        error: 'ResourceNotFound',
        resource,
        identifier,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Custom exception for resource conflicts (duplicates, etc.)
 */
export class ResourceConflictException extends HttpException {
  constructor(message: string, field?: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'ResourceConflict',
        field,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Custom exception for database errors
 */
export class DatabaseException extends HttpException {
  constructor(message: string, originalError?: any) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'A database error occurred',
        error: 'DatabaseError',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    // Store original error for logging
    this.original = originalError;
  }
  original?: any;
}

/**
 * Custom exception for authentication failures
 */
export class AuthenticationException extends HttpException {
  constructor(message: string = 'Authentication failed') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/**
 * Custom exception for authorization failures
 */
export class AuthorizationException extends HttpException {
  constructor(
    message: string = 'You do not have permission to access this resource',
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Custom exception for business logic violations
 */
export class BusinessLogicException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'BusinessLogicViolation',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Custom exception for external service failures
 */
export class ExternalServiceException extends HttpException {
  constructor(service: string, message: string) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `External service error: ${service}`,
        error: 'ExternalServiceUnavailable',
        service,
        details: process.env.NODE_ENV === 'development' ? message : undefined,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Custom exception for invalid input parameters
 */
export class InvalidParameterException extends HttpException {
  constructor(parameter: string, reason: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid parameter: ${parameter}. ${reason}`,
        error: 'InvalidParameter',
        parameter,
        reason,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Custom exception for rate limiting
 */
export class RateLimitException extends HttpException {
  constructor(message: string = 'Too many requests') {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        error: 'RateLimitExceeded',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Custom exception for timeout errors
 */
export class TimeoutException extends HttpException {
  constructor(operation: string) {
    super(
      {
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message: `Operation "${operation}" timed out`,
        error: 'OperationTimeout',
        operation,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}
