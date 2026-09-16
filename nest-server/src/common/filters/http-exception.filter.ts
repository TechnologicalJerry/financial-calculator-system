import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../dto/api-response.dto.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody = exception instanceof HttpException ? exception.getResponse() : 'Internal Server Error';

    const message = typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody
      ? Array.isArray((responseBody as any).message)
        ? (responseBody as any).message.join(', ')
        : (responseBody as any).message
      : typeof responseBody === 'string'
      ? responseBody
      : 'An unexpected error occurred';

    const errorCode = exception instanceof HttpException ? exception.name : 'INTERNAL_SERVER_ERROR';

    if (status >= 500) {
      this.logger.error(`❌ [500 SERVER ERROR] ${request.method} ${request.url} - ${message}`, exception instanceof Error ? exception.stack : '');
    } else {
      this.logger.warn(`⚠️ [CLIENT ERROR] ${request.method} ${request.url} Status: ${status} - ${message}`);
    }

    response.status(status).json(new ErrorResponse(errorCode, message, request.url));
  }
}
