import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorLoggingService } from '../services/error-logging.service';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ErrorHandlingInterceptor');
  private readonly errorLoggingService = new ErrorLoggingService();

  intercept(context: ExecutionContext, next: any): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Log the error
        this.errorLoggingService.logHttpError(
          response.statusCode || 500,
          request.method,
          request.url,
          error,
          request.user?.id,
        );

        // Handle specific error types
        if (error?.name === 'ValidationError') {
          return throwError(
            () =>
              new BadGatewayException({
                statusCode: 400,
                message: 'Validation failed',
                errors: error.errors || [],
                timestamp: new Date().toISOString(),
              }),
          );
        }

        if (error?.name === 'TimeoutError') {
          this.logger.error(`Request timeout: ${request.url}`);
          return throwError(
            () =>
              new BadGatewayException({
                statusCode: 504,
                message: 'Request timeout',
                timestamp: new Date().toISOString(),
              }),
          );
        }

        // Re-throw the error to be handled by exception filter
        return throwError(() => error);
      }),
    );
  }
}
