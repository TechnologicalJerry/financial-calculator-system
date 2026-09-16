import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, originalUrl, body, ip, query } = req;
    const startTime = Date.now();

    // Sanitize body payload to mask sensitive fields in terminal logs
    let sanitizedBody: any = null;
    if (body && typeof body === 'object') {
      sanitizedBody = { ...body };
      if (sanitizedBody.password) sanitizedBody.password = '***MASKED***';
      if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '***MASKED***';
      if (sanitizedBody.newPassword) sanitizedBody.newPassword = '***MASKED***';
      if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***MASKED***';
    }

    const hasBody = sanitizedBody && Object.keys(sanitizedBody).length > 0;
    const bodyStr = hasBody ? ` Payload: ${JSON.stringify(sanitizedBody)}` : '';
    const hasQuery = query && Object.keys(query).length > 0;
    const queryStr = hasQuery ? ` Query: ${JSON.stringify(query)}` : '';

    this.logger.log(`--> [INCOMING] ${method} ${originalUrl}${queryStr}${bodyStr} - IP: ${ip}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const delay = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(`<-- [OUTGOING] ${method} ${originalUrl} Status: ${statusCode} +${delay}ms`);
        },
        error: (err) => {
          const delay = Date.now() - startTime;
          const statusCode = err?.status || err?.statusCode || 500;
          const message = err?.message || 'Internal Server Error';
          this.logger.error(`<-- [ERROR] ${method} ${originalUrl} Status: ${statusCode} +${delay}ms - Error: ${message}`);
        },
      }),
    );
  }
}
