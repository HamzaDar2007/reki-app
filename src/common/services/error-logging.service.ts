import { Injectable, Logger } from '@nestjs/common';

export interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  context: string;
  stack?: string;
  metadata?: Record<string, any>;
  userId?: string;
  path?: string;
  method?: string;
}

@Injectable()
export class ErrorLoggingService {
  private readonly logger = new Logger('ErrorLogging');

  /**
   * Log an error with full context
   */
  logError(
    message: string,
    context: string,
    error?: any,
    metadata?: Record<string, any>,
  ) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context,
      metadata,
      stack: error?.stack || error?.toString(),
    };

    this.logger.error({
      message: errorLog.message,
      context: errorLog.context,
      error: error?.message || error,
      stack: error?.stack,
      metadata: errorLog.metadata,
    });

    // In production, you might want to send this to an external logging service
    this.persistLog(errorLog);
  }

  /**
   * Log a warning
   */
  logWarning(
    message: string,
    context: string,
    metadata?: Record<string, any>,
  ) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
      metadata,
    };

    this.logger.warn({
      message: errorLog.message,
      context: errorLog.context,
      metadata: errorLog.metadata,
    });

    this.persistLog(errorLog);
  }

  /**
   * Log info level message
   */
  logInfo(
    message: string,
    context: string,
    metadata?: Record<string, any>,
  ) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
      metadata,
    };

    this.logger.log({
      message: errorLog.message,
      context: errorLog.context,
      metadata: errorLog.metadata,
    });

    this.persistLog(errorLog);
  }

  /**
   * Log HTTP request errors with full context
   */
  logHttpError(
    statusCode: number,
    method: string,
    path: string,
    error: any,
    userId?: string,
  ) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `HTTP ${statusCode} ${method} ${path}`,
      context: 'HttpError',
      userId,
      path,
      method,
      stack: error?.stack || error?.toString(),
      metadata: {
        statusCode,
        errorMessage: error?.message,
        errorName: error?.name,
      },
    };

    this.logger.error({
      message: errorLog.message,
      context: errorLog.context,
      userId,
      path,
      method,
      error: error?.message || error,
      stack: error?.stack,
    });

    this.persistLog(errorLog);
  }

  /**
   * Log database errors
   */
  logDatabaseError(
    operation: string,
    error: any,
    metadata?: Record<string, any>,
  ) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Database error during ${operation}`,
      context: 'DatabaseError',
      stack: error?.stack || error?.toString(),
      metadata: {
        operation,
        errorCode: error?.code,
        errorMessage: error?.message,
        ...metadata,
      },
    };

    this.logger.error({
      message: errorLog.message,
      context: errorLog.context,
      operation,
      errorCode: error?.code,
      error: error?.message || error,
      stack: error?.stack,
    });

    this.persistLog(errorLog);
  }

  /**
   * Persist log to file or external service
   * Currently logs to console, but can be extended for file/external storage
   */
  private persistLog(log: ErrorLog): void {
    // TODO: Implement persistent storage (file, database, external service)
    // For now, logs are handled by NestJS logger
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [ERROR LOG]', JSON.stringify(log, null, 2));
    }
  }
}
