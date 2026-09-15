# Financial Calculator Platform - NestJS Enterprise Backend

Production-ready, cloud-native Enterprise Microservices & Domain API Platform built with **NestJS 11+**, **Node.js ESM**, **System Native PostgreSQL**, **Prisma ORM**, **Decimal.js**, **Passport JWT**, and **Vitest**.

---

## 🐘 System Native PostgreSQL Configuration

The application is configured to connect directly to your **System Native PostgreSQL installation** running on standard port **`5432`**.

### Environment File (`nest-server/.env`)
```env
# Native PostgreSQL Connection (Port 5432)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/financial_platform?schema=public"

# Application Server & JWT Secret
PORT=8080
JWT_SECRET="super-secret-production-jwt-key"
```

| Field | System Native PostgreSQL Parameter |
| :--- | :--- |
| **Host** | `localhost` or `127.0.0.1` |
| **Port** | **`5432`** (Standard native PostgreSQL port) |
| **User** | `postgres` |
| **Password** | `postgrespassword` |
| **Database Name** | `financial_platform` |
| **Schema** | `public` |

---

## ⚡ Quick-Start & Execution Commands

Run all commands from the `nest-server` directory:

```bash
cd nest-server
```

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration & Prisma Setup (System Native Postgres)
```bash
# 1. Create the database in Native Postgres (if not created yet)
# psql -U postgres -c "CREATE DATABASE financial_platform;"

# 2. Generate Prisma Client TypeScript types
npm run prisma:generate

# 3. Apply Prisma migrations to system native Postgres
npm run prisma:migrate

# 4. Open Prisma Studio Visual GUI
npm run prisma:studio
```

---

## 🚀 Running the Application

| Environment / Mode | Command | Description |
| :--- | :--- | :--- |
| **Development (Hot Reload)** | `npm run start:dev` | Starts NestJS with watch mode enabled |
| **Production Build** | `npm run build` | Compiles TypeScript source to ESM `dist/` |
| **Production Run** | `npm run start:prod` | Starts compiled production server (`node dist/main.js`) |
| **Debug Mode** | `npm run start:debug` | Starts with Node.js inspector attached |

* **Base API Entry Point:** `http://localhost:8080/api/v1`
* **Interactive Swagger UI Docs:** [`http://localhost:8080/api/docs`](http://localhost:8080/api/docs)

---

## 🧪 Testing Commands (Vitest)

| Test Mode | Command | Description |
| :--- | :--- | :--- |
| **Unit Tests (Run Once)** | `npm run test` | Executes unit test suites in `src/**/*.spec.ts` |
| **Unit Tests (Watch Mode)** | `npm run test:watch` | Runs tests in continuous watch mode |
| **Code Coverage Report** | `npm run test:cov` | Generates v8 code coverage summary & HTML report |
| **E2E Integration Tests** | `npm run test:e2e` | Runs HTTP supertest assertions in `test/**/*.e2e-spec.ts` |

---

## 🧮 Implemented Financial Calculation Engines

- **Compound Interest:** `POST /api/v1/calculator/compound-interest`
- **Loan Amortization Schedule:** `POST /api/v1/calculator/loan-amortization`
- **Mortgage Payment:** `POST /api/v1/calculator/mortgage`
- **Retirement & FIRE 4% Rule:** `POST /api/v1/calculator/retirement`
- **SIP Mutual Funds Projection:** `POST /api/v1/calculator/sip`
- **Time Value of Money (PV/FV):** `POST /api/v1/calculator/tvm`
- **US Progressive Income Tax Estimator:** `POST /api/v1/calculator/tax-estimator`
