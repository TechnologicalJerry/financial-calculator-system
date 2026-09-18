# Public Pages & Components Roadmap (`react-client`)

This document details all public-facing pages, components, user routing flows, and feature capabilities for the unauthenticated / marketing & onboarding surface of `react-client`.

---

## 🌐 1. Overview of Public Architecture

The public area of `react-client` serves prospective users, visitors, developers, and users completing authentication flows before entering the protected dashboard application workspace.

### Core Objectives:
1. **Conversion & Onboarding**: Seamless registration, login, and password reset experience.
2. **Interactive Showcase**: Live interactive previews of financial calculators (SIP, Compound Interest, FIRE) without mandatory login.
3. **Product Transparency**: Clear feature breakdown, subscription tier pricing matrix, and platform capabilities.
4. **Developer Gateway**: Direct access and guide to backend API capabilities and NestJS Swagger UI (`/api/docs`).

---

## 📊 2. Public Status Matrix

| Component / Page | Route Path | Implementation File | Status | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Landing Page** | `/` | `app/page.tsx` | ✅ **Done** | Core landing page with hero banner & feature highlights |
| **Login Page** | `/login` | `app/(auth)/login/page.tsx` | ✅ **Done** | Authentication form with JWT token storing |
| **Signup Page** | `/signup` | `app/(auth)/signup/page.tsx` | ✅ **Done** | User registration and account setup form |
| **Forgot Password** | `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | ✅ **Done** | Email recovery request form |
| **Reset Password** | `/reset-password` | `app/(auth)/reset-password/page.tsx` | ✅ **Done** | Reset password verification form |
| **Verify Email** | `/verify-email` | `app/(auth)/verify-email/page.tsx` | ✅ **Done** | OTP and email link confirmation view |
| **Base Header** | Nav Header | `components/layout/Navbar.tsx` | ⚠️ **Partial** | Basic header component |
| **Public Navbar** | Nav Header | `components/layout/PublicNavbar.tsx` | ⏳ **Pending** | Dedicated public navbar with CTA buttons |
| **Public Footer** | Site Footer | `components/layout/PublicFooter.tsx` | ⏳ **Pending** | Links to Legal, Pricing, Swagger, Socials |
| **Calculator Demo** | `/demo` | `app/(public)/demo/page.tsx` | ⏳ **Pending** | Live sandbox for SIP & Loan calculators |
| **Pricing & Plans** | `/pricing` | `app/(public)/pricing/page.tsx` | ⏳ **Pending** | Subscription tiers (Free vs Pro) and limits |
| **API Portal** | `/api-docs` | `app/(public)/api-docs/page.tsx` | ⏳ **Pending** | OpenAPI / Swagger gateway documentation |
| **Terms of Service** | `/terms` | `app/(public)/terms/page.tsx` | ⏳ **Pending** | Legal terms of service agreement |
| **Privacy Policy** | `/privacy` | `app/(public)/privacy/page.tsx` | ⏳ **Pending** | User data privacy and compliance policy |
| **404 Not Found** | Error Boundary | `app/not-found.tsx` | ⏳ **Pending** | Custom branded 404 page |
| **500 Server Error** | Error Boundary | `app/error.tsx` | ⏳ **Pending** | Global exception handler page |

---

## 🛠️ 3. Detailed Component & Page Specifications

### 🚀 Phase 1: Authentication & Shared Public Layouts
- [x] **`Navbar.tsx`**: Header with logo and auth link.
- [ ] **`PublicNavbar.tsx`**: Header containing:
  - Platform Logo & Brand Name
  - Navigation Links: *Calculators Demo*, *Pricing*, *API Docs*, *Features*
  - Auth Action Buttons: *Sign In*, *Get Started Free (CTA)*
- [ ] **`PublicFooter.tsx`**:
  - Multi-column footer layout (Product, Resources, Developers, Legal, Company)
  - Backend Swagger link (`http://localhost:8080/api/docs`)
  - Copyright, Terms, Privacy links

### 🧮 Phase 2: Live Calculator Sandbox (`/demo`)
- [ ] **`InteractiveCalculatorPreview.tsx`**:
  - Live interactive widget allowing visitors to calculate SIP growth and Loan Amortization.
  - Interactive slider controls for Principal Amount, Interest Rate %, and Duration (Years).
  - Live chart rendering using Recharts / SVG.
  - *Save Scenario* button prompting visitor to register/sign in.

### 💳 Phase 3: Pricing & Tier Comparison (`/pricing`)
- [ ] **`PricingCard.tsx`**:
  - Free Tier (Basic calculators, 1 portfolio, standard reports)
  - Pro Tier (Unlimited portfolios, AI Advisor copilot, custom PDF export, priority calculations)
  - Enterprise Tier (Custom API access, team management, dedicated audit logs)
- [ ] **`FeatureComparisonTable.tsx`**: Detailed matrix of features across roles (`USER`, `PREMIUM`, `ADMIN`).

### 📚 Phase 4: API Portal Gateway & Legal Pages (`/api-docs`, `/terms`, `/privacy`)
- [ ] **`ApiDocsPage`**: Explains available REST & GraphQL endpoints, authentication via Bearer JWT, and embeds quick link to backend Swagger UI.
- [ ] **`TermsPage` & `PrivacyPage`**: Standard legal text components with table of contents sidebar.

---

## 🔗 Related Roadmaps
- **Protected Workspace Roadmap**: See [dashboard-roadmap.md](file:///d:/Gitlab%20Collaborative/Worktrees/ekta/react-client/dashboard-roadmap.md) for protected pages (`/dashboard`, `/portfolios`, `/net-worth`, `/calculators`, `/ai-advisor`).
