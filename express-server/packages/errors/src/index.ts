export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_SUSPENDED = 'USER_SUSPENDED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  REFRESH_TOKEN_REUSED = 'REFRESH_TOKEN_REUSED',
  ACCOUNT_ACCESS_DENIED = 'ACCOUNT_ACCESS_DENIED',
  CALCULATOR_NOT_FOUND = 'CALCULATOR_NOT_FOUND',
  CALCULATOR_INPUT_INVALID = 'CALCULATOR_INPUT_INVALID',
  CALCULATION_FAILED = 'CALCULATION_FAILED',
  INVALID_CALCULATOR_PARAMETER = 'INVALID_CALCULATOR_PARAMETER',
  INVALID_TERM = 'INVALID_TERM',
  INVALID_INTEREST_RATE = 'INVALID_INTEREST_RATE',
  INVALID_PRINCIPAL = 'INVALID_PRINCIPAL',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  INVALID_PAYMENT_FREQUENCY = 'INVALID_PAYMENT_FREQUENCY',
}

export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(requestId?: string, includeStack = false) {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
        ...(requestId ? { requestId } : {}),
        ...(this.details !== undefined ? { details: this.details } : {}),
        ...(includeStack && this.stack ? { stack: this.stack } : {}),
      },
    };
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly code = ErrorCode.VALIDATION_ERROR;
}

export class AuthenticationError extends AppError {
  public readonly statusCode = 401;
  public readonly code: string;
  constructor(message = 'Authentication failed', code: string = ErrorCode.AUTHENTICATION_ERROR, details?: unknown) {
    super(message, details);
    this.code = code;
  }
}

export class AuthorizationError extends AppError {
  public readonly statusCode = 403;
  public readonly code: string;
  constructor(message = 'Access denied', code: string = ErrorCode.AUTHORIZATION_ERROR, details?: unknown) {
    super(message, details);
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = ErrorCode.NOT_FOUND_ERROR;
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code: string;
  constructor(message = 'Resource conflict', code: string = ErrorCode.CONFLICT_ERROR, details?: unknown) {
    super(message, details);
    this.code = code;
  }
}

export class BusinessError extends AppError {
  public readonly statusCode = 422;
  public readonly code = ErrorCode.BUSINESS_ERROR;
}

export class DatabaseError extends AppError {
  public readonly statusCode = 500;
  public readonly code = ErrorCode.DATABASE_ERROR;
  constructor(message = 'Database operation failed', details?: unknown) {
    super(message, details, false);
  }
}

export class ExternalServiceError extends AppError {
  public readonly statusCode = 502;
  public readonly code = ErrorCode.EXTERNAL_SERVICE_ERROR;
}

export class TimeoutError extends AppError {
  public readonly statusCode = 504;
  public readonly code = ErrorCode.TIMEOUT_ERROR;
}

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
  public readonly code = ErrorCode.INTERNAL_SERVER_ERROR;
  constructor(message = 'An unexpected internal error occurred', details?: unknown) {
    super(message, details, false);
  }
}

export class CalculatorNotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = ErrorCode.CALCULATOR_NOT_FOUND;
  constructor(calculatorId: string) {
    super(`Calculator with ID '${calculatorId}' not found`);
  }
}

export class CalculatorInputError extends AppError {
  public readonly statusCode = 400;
  public readonly code: string;
  constructor(message = 'Invalid calculator input', details?: unknown, code: string = ErrorCode.CALCULATOR_INPUT_INVALID) {
    super(message, details);
    this.code = code;
  }
}

export class CalculationFailedError extends AppError {
  public readonly statusCode = 422;
  public readonly code = ErrorCode.CALCULATION_FAILED;
  constructor(message = 'Calculation failed', details?: unknown) {
    super(message, details);
  }
}
