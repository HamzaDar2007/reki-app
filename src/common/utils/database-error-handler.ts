import {
  QueryFailedError,
  EntityNotFoundError,
  TypeORMError,
} from 'typeorm';
import {
  DatabaseException,
  ResourceConflictException,
  InvalidParameterException,
} from '../exceptions/custom-exceptions';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseErrorHandler');

/**
 * Handles TypeORM database errors and converts them to appropriate exceptions
 */
export class DatabaseErrorHandler {
  /**
   * Handle a database error and throw appropriate exception
   */
  static handle(error: any, operation?: string): never {
    // Handle TypeORM QueryFailedError (SQL errors)
    if (error instanceof QueryFailedError) {
      return this.handleQueryFailedError(error, operation);
    }

    // Handle EntityNotFoundError
    if (error instanceof EntityNotFoundError) {
      const message = error.message || 'Entity not found';
      throw new DatabaseException(message, error);
    }

    // Handle other TypeORM errors
    if (error instanceof TypeORMError) {
      const message = error.message || 'Database error occurred';
      logger.error(`TypeORM Error [${operation}]:`, error);
      throw new DatabaseException(message, error);
    }

    // Handle unknown database errors
    const errorMessage = error?.message || 'An unexpected database error occurred';
    logger.error(`Unknown Database Error [${operation}]:`, error);
    throw new DatabaseException(errorMessage, error);
  }

  /**
   * Handle QueryFailedError specifically
   */
  private static handleQueryFailedError(
    error: QueryFailedError,
    operation?: string,
  ): never {
    const driverError = error.driverError || error;
    const code = (driverError as any).code;
    const message = driverError.message || error.message;

    logger.error(`Query Failed [${operation}] - Code: ${code}`, message);

    // Unique constraint violation
    if (code === '23505') {
      const match = message.match(/Key \((.*?)\)/);
      const field = match ? match[1] : 'Field';
      throw new ResourceConflictException(
        `A record with this ${field} already exists`,
        field,
      );
    }

    // Foreign key constraint violation
    if (code === '23503') {
      throw new InvalidParameterException(
        'foreign key reference',
        'The referenced record does not exist or has been deleted',
      );
    }

    // Not null constraint violation
    if (code === '23502') {
      const match = message.match(/column "(.*?)" of relation/);
      const field = match ? match[1] : 'required field';
      throw new InvalidParameterException(
        field,
        'This field is required',
      );
    }

    // Check constraint violation
    if (code === '23514') {
      throw new InvalidParameterException(
        'validation',
        'The provided value violates database constraints',
      );
    }

    // Connection errors
    if (code === 'ECONNREFUSED' || code === '28P01') {
      throw new DatabaseException(
        'Database connection failed. Please try again later.',
        error,
      );
    }

    // Default case
    throw new DatabaseException(
      'A database error occurred during the operation',
      error,
    );
  }

  /**
   * Wrap async database operations with error handling
   */
  static async wrap<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handle(error, operationName);
    }
  }
}

/**
 * Decorator for automatic database error handling
 */
export function CatchDatabaseErrors(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const opName = operationName || `${target.constructor.name}.${propertyKey}`;
        DatabaseErrorHandler.handle(error, opName);
      }
    };

    return descriptor;
  };
}
