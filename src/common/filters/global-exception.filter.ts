import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ErrorLoggingService } from '../services/error-logging.service';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');
  private readonly errorLoggingService = new ErrorLoggingService();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorResponse: Record<string, any> = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };

    // Handle Database Errors (QueryFailedError from TypeORM)
    if (exception instanceof QueryFailedError) {
      const converted = this.convertDatabaseError(exception);
      status = converted.status;
      message = converted.message;
      errorResponse = {
        statusCode: status,
        message,
        error: converted.error,
        timestamp: new Date().toISOString(),
      };
    }
    // Handle HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || message;
        errorResponse = {
          ...errorResponse,
          ...responseObj,
          statusCode: status,
        };
      }
    } else if (exception instanceof Error) {
      // Handle generic Error (including database errors that weren't caught)
      const dbError = this.extractDatabaseError(exception);
      if (dbError) {
        const converted = this.convertDatabaseError(dbError);
        status = converted.status;
        message = converted.message;
        errorResponse = {
          statusCode: status,
          message,
          error: converted.error,
          timestamp: new Date().toISOString(),
        };
      } else {
        message = exception.message || 'An unexpected error occurred';
        this.logger.error(
          `Unhandled Error: ${message}`,
          exception.stack,
        );
        errorResponse = {
          statusCode: status,
          message,
          error: 'InternalServerError',
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Add request tracking information in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.path = request.url;
      errorResponse.method = request.method;
    }

    // Log the error
    this.logError(
      exception,
      request,
      status,
      message,
    );

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Convert database errors to user-friendly messages
   */
  private convertDatabaseError(error: QueryFailedError): {
    status: number;
    message: string;
    error: string;
  } {
    const driverError = error.driverError || error;
    const code = (driverError as any).code;
    const detail = (driverError as any).detail || '';

    this.logger.error(`Database Error [Code: ${code}]:`, error.message);

    // Unique constraint violation (23505)
    if (code === '23505') {
      let field = 'Email'; // Default
      if (detail.includes('email')) {
        field = 'Email';
      } else if (detail.includes('username')) {
        field = 'Username';
      } else if (detail.includes('key')) {
        const match = detail.match(/Key \((.*?)\)/);
        if (match) {
          field = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }
      return {
        status: HttpStatus.CONFLICT,
        message: `${field} already exists. Please use a different ${field.toLowerCase()}.`,
        error: 'ConflictError',
      };
    }

    // Foreign key constraint violation (23503)
    if (code === '23503') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message:
          'Referenced resource does not exist. Please verify all IDs are correct.',
        error: 'InvalidReferenceError',
      };
    }

    // NOT NULL constraint violation (23502)
    if (code === '23502') {
      const match = detail.match(/column "(.*?)"/);
      const field = match ? match[1] : 'required field';
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `The ${field.replace(/_/g, ' ')} field is required.`,
        error: 'MissingRequiredFieldError',
      };
    }

    // Check constraint violation (23514)
    if (code === '23514') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more fields contain invalid values.',
        error: 'ValidationError',
      };
    }

    // Connection errors
    if (
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === '28P01'
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection failed. Please try again later.',
        error: 'DatabaseConnectionError',
      };
    }

    // Timeout
    if (code === 'ETIMEDOUT' || code === 'EHOSTUNREACH') {
      return {
        status: HttpStatus.GATEWAY_TIMEOUT,
        message: 'Database operation timed out. Please try again.',
        error: 'TimeoutError',
      };
    }

    // Default database error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'A database error occurred. Please try again later.',
      error: 'DatabaseError',
    };
  }

  /**
   * Extract database error from generic error
   */
  private extractDatabaseError(error: Error): QueryFailedError | null {
    if (error instanceof QueryFailedError) {
      return error;
    }

    // Check if error has database-related properties
    const anyError = error as any;
    if (
      anyError.code &&
      (anyError.code.startsWith('23') ||
        anyError.code === 'ECONNREFUSED' ||
        anyError.code === 'ENOTFOUND')
    ) {
      // Wrap in QueryFailedError-like structure
      return {
        query: '',
        parameters: [],
        driverError: anyError,
      } as any;
    }

    return null;
  }

  /**
   * Log error with full context
   */
  private logError(
    exception: unknown,
    request: Request,
    status: number,
    message: string,
  ): void {
    const userId = (request as any).user?.id;
    const metadata = {
      path: request.url,
      method: request.method,
      query: request.query,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    if (status >= 500) {
      // Server errors
      this.errorLoggingService.logHttpError(
        status,
        request.method,
        request.url,
        exception,
        userId,
      );
      this.logger.error(
        `HTTP ${status} - ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      // Client errors
      this.errorLoggingService.logWarning(
        `HTTP ${status} - ${message}`,
        'ClientError',
        metadata,
      );
      this.logger.warn(
        `HTTP ${status} - ${request.method} ${request.url}: ${message}`,
      );
    }
  }
}
