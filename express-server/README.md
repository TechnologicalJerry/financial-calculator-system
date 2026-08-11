# Financial Calculator System - Express/TypeScript

Enterprise financial calculator system backend (Stage 1 & Stage 2 Foundation).

## Technology Stack

- **Node.js**: v24 (LTS)
- **Framework**: Express.js
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL & Prisma ORM
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **Authentication**: JWT & Bcrypt (Password Hashing)
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Jest & Supertest
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## Setup

1. Copy environment example:
   ```bash
   cp .env.example .env
   ```

2. Start local infrastructure services (PostgreSQL, Redis, RabbitMQ):
   ```bash
   docker-compose up -d
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

## Development Commands

- `npm run dev`: Start API Gateway server with hot reload
- `npm run build`: Compile TypeScript code
- `npm start`: Start compiled production server
- `npm run typecheck`: Run TypeScript type checker
- `npm run lint`: Run ESLint check
- `npm run lint:fix`: Fix ESLint errors
- `npm run format`: Format code with Prettier
- `npm run format:check`: Check code formatting with Prettier

## Testing Commands

- `npm test`: Run unit & integration tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate test coverage report

## Stage 2 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register`: User registration & financial profile initialization
- `POST /api/v1/auth/login`: User authentication & JWT / refresh token issuance
- `POST /api/v1/auth/refresh`: Refresh token rotation & new access token issuance
- `POST /api/v1/auth/logout`: Revoke active refresh session
- `GET /api/v1/me`: Get current authenticated user details

### Financial Profile (`/api/v1/profile`)
- `GET /api/v1/profile`: Get current user financial profile & preferences
- `PATCH /api/v1/profile`: Update current user financial profile (income, expenses, risk tolerance)

### Financial Accounts (`/api/v1/accounts`)
- `GET /api/v1/accounts`: List user financial accounts
- `GET /api/v1/accounts/:id`: Get single account by ID (IDOR protected)
- `POST /api/v1/accounts`: Create new financial account
- `PATCH /api/v1/accounts/:id`: Update financial account (IDOR protected)
- `DELETE /api/v1/accounts/:id`: Soft delete financial account (IDOR protected)

### Health (`/api/v1/health`)
- `GET /api/v1/health`: Overall health metadata
- `GET /api/v1/health/live`: Process liveness probe
- `GET /api/v1/health/ready`: Infrastructure readiness probe (PostgreSQL, Redis, RabbitMQ)
- `GET /api/v1/health/startup`: Startup completion probe

## Database Models

- `User`: Core persistent user entity & authentication state
- `RefreshSession`: Secure database-backed refresh token sessions with rotation history
- `FinancialProfile`: Core financial profile metrics (income, expenses, risk tolerance)
- `FinancialPreferences`: Locale, base currency, and formatting preferences
- `FinancialAccount`: User-owned monetary accounts (Bank, Cash, Investment, etc.) with PostgreSQL Decimal precision

### Stage 6 — Investment & Portfolio Management (`/api/v1/portfolios`, `/api/v1/securities`)
- `POST /api/v1/portfolios`: Create portfolio
- `GET /api/v1/portfolios`: List user portfolios
- `GET /api/v1/portfolios/:id`: Get portfolio detail (IDOR protected)
- `PATCH /api/v1/portfolios/:id`: Update portfolio (IDOR protected)
- `DELETE /api/v1/portfolios/:id`: Delete portfolio (IDOR protected)
- `GET /api/v1/portfolios/:id/valuation`: Portfolio valuation metrics (market value, cost, unrealized & realized gain/loss, cash balance)
- `GET /api/v1/portfolios/:id/allocation`: Portfolio asset type & security allocation breakdown
- `GET /api/v1/portfolios/:id/performance`: Portfolio performance foundation summary
- `POST /api/v1/portfolios/:portfolioId/accounts`: Create investment account
- `GET /api/v1/portfolios/:portfolioId/accounts`: List investment accounts
- `POST /api/v1/portfolios/:portfolioId/transactions/buy`: Execute BUY transaction (atomic balance & position average cost update)
- `POST /api/v1/portfolios/:portfolioId/transactions/sell`: Execute SELL transaction (atomic balance & realized gain/loss snapshot update)
- `POST /api/v1/portfolios/:portfolioId/transactions/dividend`: Execute DIVIDEND transaction
- `POST /api/v1/portfolios/:portfolioId/transactions/deposit`: Execute DEPOSIT transaction
- `POST /api/v1/portfolios/:portfolioId/transactions/withdrawal`: Execute WITHDRAWAL transaction
- `GET /api/v1/securities`: List/search securities
- `GET /api/v1/securities/:id`: Get security detail

### Stage 8 — Financial Analytics & Reporting (`/api/v1/analytics`, `/api/v1/reports`)
- `GET /api/v1/analytics/dashboard`: Consolidated financial dashboard snapshot
- `GET /api/v1/analytics/net-worth`: Net worth calculations (Assets - Liabilities)
- `GET /api/v1/analytics/net-worth/history`: Net worth history time series
- `GET /api/v1/analytics/asset-allocation`: Consolidated asset allocation breakdown
- `GET /api/v1/analytics/expenses`: Expense analytics, average expense & category breakdown
- `GET /api/v1/analytics/income`: Income analytics & breakdown
- `GET /api/v1/analytics/cash-flow`: Cash flow inflows, outflows & net breakdown
- `GET /api/v1/analytics/budgets`: Budget analytics & category utilization
- `GET /api/v1/analytics/goals`: Goal progress & target analytics
- `GET /api/v1/analytics/investments`: Portfolio investment metrics
- `POST /api/v1/reports`: Generate & persist financial report metadata
- `GET /api/v1/reports`: List user reports
- `GET /api/v1/reports/:id`: Get report detail (IDOR protected)

## Scope

- **Stage 1**: Foundation, Modular Architecture, Infrastructure Clients, Pino Logging, Security & Error Middleware
- **Stage 2**: User Identity Persistence, Bcrypt Password Hashing, JWT Auth, Refresh Token Rotation, Financial Profiles, Accounts CRUD & Strict IDOR Protection
- **Stage 3**: Financial Calculators Engine, Arbitrary Precision Decimals, Zod Schemas & Calculators API
- **Stage 4**: Calculation History, Version Snapshots, Audit Events & Domain Event Messaging
- **Stage 5**: Budgeting & Financial Goals, Category Allocations, Expense Tracking, Atomic Balance Updates & IDOR Protection
- **Stage 6**: Investment & Portfolio Management, Holdings, Cost Basis, Realized/Unrealized Gains, Cash Transactions & Domain Events
- **Stage 7**: Existing Advanced Functionality
- **Stage 8**: Financial Analytics & Reporting, Consolidated Dashboard, Net Worth, Cash Flow & Report Metadata
- **Stage 9**: Security & Production Hardening, Rate Limiting, Pino Redaction, Helmet, CORS & Graceful Shutdown
- **Stage 10**: Final Productionization, Complete Unit/Integration Test Coverage, Clean Build & Project Documentation


