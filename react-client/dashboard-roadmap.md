# Protected Workspace & Dashboard Roadmap (`react-client`)

This document outlines all backend NestJS / Spring microservice capabilities, existing API service layers, and the detailed audit of protected application workspace pages and components for `react-client`.

> 🔗 **Public Pages & Components Roadmap**: For unauthenticated pages, landing hero, calculator demos, and pricing, see [public-roadmap.md](file:///d:/Gitlab%20Collaborative/Worktrees/ekta/react-client/public-roadmap.md).

---

## 🏗️ 1. Backend Domain Architecture & API Service Clients

The `react-client` workspace connects directly to the **NestJS Backend (`nest-server`)** (with 100% route contract parity to Spring Boot microservices).

### 🛠️ Configured API Client Services (`src/services/*`):
- [x] **`auth.service.ts`**: Login, Signup, Logout, Password Reset, Email Verification (`/api/v1/auth/*`)
- [x] **`user.service.ts`**: User Profile & User Preferences management (`/api/v1/users/*`)
- [x] **`ai.service.ts`**: AI Advisor chat, conversation history & health score (`/api/v1/ai/*`)
- [x] **`investment.service.ts`**: Portfolios, Assets, Liabilities, Investment Accounts (`/api/v1/investments/*`, `/api/v1/portfolios/*`)
- [x] **`notification.service.ts`**: Real-time notification feed, unread count & read toggles (`/api/v1/notifications/*`)
- [x] **`calculator.service.ts`**: SIP, Lumpsum, Loan Amortization, Mortgage, FIRE, TVM, Inflation, Tax (`/api/v1/calculator/*`)
- [x] **`analytics.service.ts`**: Dashboard Metrics, History Search/Archive/Pin, Reports Generation/Export, Favorites (`/api/v1/dashboard`, `/api/v1/analytics/*`, `/api/v1/reports/*`, `/api/v1/history/*`, `/api/v1/favorites/*`)
- [x] **`document.service.ts`**: File Upload/Download, Metadata Tagging, Folder Hierarchy (`/api/v1/documents/*`, `/api/v1/folders/*`)
- [x] **`admin.service.ts`**: Users, Roles & RBAC, Tax Rules, Formulas, Feature Flags, Approvals, Configs, Audit Logs, Jobs (`/api/v1/admin/*`)

---

## 📊 2. Protected Workspace Status Matrix

| Component / Page | Type | Route Path | Implementation File | Status | Description |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Theme Toggle Button** | Component | Topbar Header | `components/layout/ThemeToggle.tsx` | ✅ **Done** | Dark / Light theme switcher with local storage persistence |
| **User Avatar Menu** | Component | Topbar Header | `components/layout/UserAvatarMenu.tsx` | ✅ **Done** | Dropdown with user avatar & logout |

| **Sidebar Nav** | Component | Left Navigation | `components/layout/SidebarNav.tsx` | ✅ **Done** | Collapsible sidebar with active route state & badges |
| **Protected App Layout**| Component | Layout Shell | `app/(protected)/layout.tsx` | ✅ **Done** | Main layout wrapper with sidebar & auth protection |
| **API Client Services** | Service | Global Client | `src/services/*` | ✅ **Done** | Pre-built API client services (100% endpoint coverage) |
| **Overview Dashboard** | Page | `/dashboard` | `app/(protected)/dashboard/page.tsx` | 🏗️ **Placeholder Built** | Overview dashboard shell with widget grids |
| **Metric Cards Grid** | Component | Overview | `components/dashboard/MetricCardsGrid.tsx` | 🏗️ **Placeholder Built** | Net Worth, Calculations, Favorites summary cards |
| **Net Worth Chart** | Component | Overview | `components/dashboard/NetWorthSummaryChart.tsx` | 🏗️ **Placeholder Built** | Net Worth growth area visualizer placeholder |
| **Asset Allocation Donut**| Component | Overview | `components/dashboard/AssetAllocationPieChart.tsx` | 🏗️ **Placeholder Built** | Donut chart for asset distribution placeholder |
| **Portfolios Management**| Page | `/portfolios` | `app/(protected)/portfolios/page.tsx` | 🏗️ **Placeholder Built** | Multi-portfolio CRUD & accounts list view |
| **Portfolio Selector** | Component | Portfolios | `components/portfolio/PortfolioSelector.tsx` | 🏗️ **Placeholder Built** | Active portfolio dropdown switcher |
| **Net Worth & Assets** | Page | `/net-worth` | `app/(protected)/net-worth/page.tsx` | 🏗️ **Placeholder Built** | Asset vs liability tracking & goals page |
| **Asset Liability Table**| Component | Net Worth | `components/portfolio/AssetLiabilityTable.tsx` | 🏗️ **Placeholder Built** | Assets & Liabilities data table widget |
| **Calculators Suite** | Page | `/calculators` | `app/(protected)/calculators/page.tsx` | 🏗️ **Placeholder Built** | Interactive SIP, Loan & FIRE calculators page |
| **SIP Calculator Widget**| Component | Calculators | `components/calculator/SipCalculatorWidget.tsx` | 🏗️ **Placeholder Built** | SIP calculation sliders & returns visualizer |
| **Loan Amortization** | Component | Calculators | `components/calculator/LoanAmortizationWidget.tsx` | 🏗️ **Placeholder Built** | Payment schedule table & principal breakdown |
| **AI Advisor Copilot** | Page | `/ai-advisor` | `app/(protected)/ai-advisor/page.tsx` | 🏗️ **Placeholder Built** | Interactive chat & smart insight feed page |
| **AI Chat Interface** | Component | AI Advisor | `components/ai/AiChatInterface.tsx` | 🏗️ **Placeholder Built** | Conversational chat & prompt input widget |
| **Notification Center** | Page | `/notifications` | `app/(protected)/notifications/page.tsx` | 🏗️ **Placeholder Built** | User notification hub & unread filters page |
| **Document Vault** | Page | `/documents` | `app/(protected)/documents/page.tsx` | 🏗️ **Placeholder Built** | Vault file storage & folder upload page |
| **Reports & Exports** | Page | `/reports` | `app/(protected)/reports/page.tsx` | 🏗️ **Placeholder Built** | Report history & PDF/CSV export downloads page |
| **Admin Control Panel** | Page | `/admin` | `app/(protected)/admin/page.tsx` | 🏗️ **Placeholder Built** | User management, feature flags, approvals page |
| **User Management** | Component | Admin | `components/admin/UserManagementTable.tsx` | 🏗️ **Placeholder Built** | RBAC user role & account status data grid |
| **User Settings** | Page | `/settings` | `app/(protected)/settings/page.tsx` | 🏗️ **Placeholder Built** | Profile details, security & theme options page |

---

## 🛠️ API Endpoint Mapping Summary

| Protected UI Page | NestJS API Route | API Client Service |
| :--- | :--- | :--- |
| **Overview Dashboard** | `GET /api/v1/dashboard` | `analyticsService.getDashboardSummary()` |
| **User Portfolios** | `GET /api/v1/portfolios` | `investmentService.getPortfolios()` |
| **Net Worth & Assets** | `GET /api/v1/net-worth` | `investmentService.getNetWorth()` |
| **Calculators Engine** | `POST /api/v1/calculator/*` | `calculatorService.calculateSip()`, etc. |
| **AI Advisor Chat** | `POST /api/v1/ai/chat` | `aiService.sendMessage()` |
| **Notifications Bell** | `GET /api/v1/notifications` | `notificationService.getNotifications()` |
| **Document Vault** | `GET /api/v1/documents` | `documentService.getDocuments()` |
| **Admin Controls** | `GET /api/v1/admin/*` | `adminService.getUsers()`, etc. |
