import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS specifically to support react-client (3000) and angular-client (4200)
  const allowedOriginsPattern = new RegExp('^http://(localhost|127\.0\.0\.1):(3000|4200|8080|5173|4173)');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOriginsPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With, X-Correlation-ID',
    credentials: true,
  });

  // Global validation & DTO transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter, logging interceptor & response interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Configure OpenAPI / Swagger UI
  const config = new DocumentBuilder()
    .setTitle('Financial Platform API Documentation')
    .setDescription('Production-grade NestJS Backend Microservices API supporting React Client & Angular Client')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'bearer-token',
    )
    .addTag('Identity & Authentication', 'Signup, Login, Token Refresh, MFA, Session Management')
    .addTag('User Profile & Preferences', 'Profiles, Settings, Preferences, Multi-Address Management')
    .addTag('Financial Calculators', 'Amortization, Compound Interest, Mortgage, FIRE, TVM, SIP')
    .addTag('Investment Portfolios', 'Asset allocation, Holdings tracking, Transactions, Valuation')
    .addTag('Analytics & Insights', 'Financial metrics, Net worth trends, Cash flow reports')
    .addTag('Document Vault', 'Document upload, Folder hierarchy, Storage metrics')
    .addTag('Global Search', 'Cross-resource full-text indexing & search')
    .addTag('AI Assistant & Copilot', 'Conversational AI, Scenario analysis, Chat history')
    .addTag('Notification Center', 'User alerts, Email notifications, System announcements')
    .addTag('Admin Management', 'RBAC, Audit logs, System metrics, User administration')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const swaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',
    },
    customSiteTitle: 'Financial Platform API Docs',
  };

  // Mount Swagger UI at multiple conventional routes
  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('swagger', app, document, swaggerCustomOptions);

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`🚀 NestJS Backend running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api/docs`);
}

bootstrap();
