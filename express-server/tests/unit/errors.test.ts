import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessError,
  DatabaseError,
  ExternalServiceError,
  TimeoutError,
  InternalServerError,
  ErrorCode,
} from '@packages/errors';

describe('Error Package Unit Tests', () => {
  it('should construct ValidationError with correct properties', () => {
    const error = new ValidationError('Invalid request input', { field: 'email' });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid request input');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should construct AuthenticationError with 401 status code', () => {
    const error = new AuthenticationError('Token expired');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
  });

  it('should construct AuthorizationError with 403 status code', () => {
    const error = new AuthorizationError('Forbidden resource');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCode.AUTHORIZATION_ERROR);
  });

  it('should construct NotFoundError with 404 status code', () => {
    const error = new NotFoundError('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND_ERROR);
  });

  it('should construct ConflictError with 409 status code', () => {
    const error = new ConflictError('User already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe(ErrorCode.CONFLICT_ERROR);
  });

  it('should construct BusinessError with 422 status code', () => {
    const error = new BusinessError('Insufficient funds');
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe(ErrorCode.BUSINESS_ERROR);
  });

  it('should construct DatabaseError with 500 status code', () => {
    const error = new DatabaseError('Connection failed');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
  });

  it('should construct ExternalServiceError with 502 status code', () => {
    const error = new ExternalServiceError('Payment gateway timeout');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
  });

  it('should construct TimeoutError with 504 status code', () => {
    const error = new TimeoutError('Request timed out');
    expect(error.statusCode).toBe(504);
    expect(error.code).toBe(ErrorCode.TIMEOUT_ERROR);
  });

  it('should construct InternalServerError with 500 status code', () => {
    const error = new InternalServerError('Unexpected crash');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
  });

  it('should serialize error safely to JSON response structure', () => {
    const error = new ValidationError('Bad request data');
    const json = error.toJSON('req-123');
    expect(json).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Bad request data',
        requestId: 'req-123',
      },
    });
  });
});
