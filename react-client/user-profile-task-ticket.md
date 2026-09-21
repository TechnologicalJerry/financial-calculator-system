# 🎟️ Task Ticket: User Profile & Account Settings Implementation

**Ticket ID:** `FE-TICKET-101`  
**Module:** `react-client` (Protected Application Workspace)  
**Target Route:** `/settings` (`app/(protected)/settings/page.tsx`) & `/profile` (`app/(protected)/profile/page.tsx`)  
**Assigned To:** Frontend Developer  
**Priority:** High  
**Status:** Ready for Development  

---

## 🎯 1. Objective & Overview

Build a production-ready, tabbed **User Profile & Account Settings Workspace** that allows users to view, edit, and manage their personal identity, credentials, active sessions, localization preferences, addresses, and notification settings with full backend integration (`userService` & `authService`).

---

## 🏗️ 2. Status Breakdown: What is Already Implemented vs. What Remains to Build

### ✅ A. What is ALREADY IMPLEMENTED & READY (Pre-built Infrastructure)
- **`src/services/user.service.ts`**: API Client functions implemented (`getCurrentUser`, `updateProfile`, `getUserPreferences`, `updateUserPreferences`, `getActiveSessions`, `revokeSession`, `revokeAllSessions`).
- **`src/services/auth.service.ts`**: Auth API functions implemented (`changePassword`, `forgotPassword`, `resetPassword`).
- **`src/store/useAuthStore.ts`**: Zustand auth state store initialized (`user`, `accessToken`, `setAuth`, `logout`).
- **`src/components/layout/Navbar.tsx` & `UserAvatarMenu.tsx`**: Header profile avatar dropdown and logout handler.
- **`src/components/layout/ThemeToggle.tsx`**: Dark/Light mode theme switcher.
- **`src/components/profile/ActiveSessionsList.tsx`**: Existing active device sessions list widget.
- **`src/app/(protected)/settings/page.tsx`**: Target route placeholder.

### ⏳ B. What REMAINS TO BUILD (Developer Deliverables)
- **`src/components/profile/UserProfileTab.tsx`**: Personal info form & avatar uploader.
- **`src/components/profile/AccountSecurityTab.tsx`**: Password change form, 2FA toggle, and sessions management integration.
- **`src/components/profile/PreferencesTab.tsx`**: Financial currency, language, timezone, decimal precision, and theme selectors.
- **`src/components/profile/AddressesTab.tsx`**: Address cards list & add/edit address modal.
- **`src/components/profile/NotificationsTab.tsx`**: Notification delivery channel toggles.
- **`src/app/(protected)/settings/page.tsx`**: Tabbed container interface wiring all 5 sub-tabs together.

---

## 📐 3. Component Architecture

```
src/
├── app/(protected)/settings/page.tsx   [UPDATE: Wire Tabbed Container]
└── components/profile/
    ├── UserProfileTab.tsx              [NEW: Build Form]
    ├── AccountSecurityTab.tsx          [NEW: Build Form]
    ├── PreferencesTab.tsx              [NEW: Build Form]
    ├── AddressesTab.tsx                [NEW: Build Form]
    ├── NotificationsTab.tsx            [NEW: Build Form]
    └── ActiveSessionsList.tsx          [EXISTING: Re-use]
```

---

## 📋 4. Detailed Component Specifications

### 👤 Tab 1: Personal Profile (`UserProfileTab.tsx`)
* **Avatar Uploader**:
  * Profile avatar image preview with custom file uploader.
  * API call: `userService.updateProfile({ avatarUrl })` or `POST /api/v1/user-profiles/me/avatar`.
* **Profile Completion Bar**:
  * Visual progress bar showing `profileCompletionPercentage` (e.g. `85% Complete`).
* **Personal Fields Form**:
  * `firstName` (text)
  * `lastName` (text)
  * `username` (text - read-only / disabled)
  * `email` (email - read-only with `Verified` badge)
  * `phoneNumber` (tel)
  * `bio` (textarea)
  * `dateOfBirth` (date picker)
  * `gender` (select: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`)
  * `occupation` (text)
  * `company` (text)
* **Actions**: `Save Profile Changes` button with loading spinner & toast feedback.

---

### 🛡️ Tab 2: Account Security & Active Sessions (`AccountSecurityTab.tsx`)
* **Account Status Badge**:
  * Displays account state (`ACTIVE`, `LOCKED`, `SUSPENDED`).
* **Assigned System Roles**:
  * Displays role tags (`ROLE_USER`, `ROLE_PREMIUM`, `ROLE_ADMIN`).
* **Change Password Form**:
  * Fields: `currentPassword`, `newPassword`, `confirmPassword`.
  * API call: `authService.changePassword({ currentPassword, newPassword })`.
* **Two-Factor Authentication (2FA)**:
  * Toggle switch for `isMfaEnabled`.
* **Active Sessions & Device Management**:
  * Re-use existing `<ActiveSessionsList />` component:
    * Displays device name, browser, OS, IP address, last active timestamp.
    * Calls `userService.revokeSession(sessionId)` & `userService.revokeAllSessions()`.

---

### 🌐 Tab 3: Preferences & Financial Localization (`PreferencesTab.tsx`)
* **Financial Currency**:
  * Dropdown: `USD ($)`, `EUR (€)`, `GBP (£)`, `INR (₹)`, `CAD ($)`, `AUD ($)`.
* **Language & Region**:
  * Dropdown: `English (en)`, `Spanish (es)`, `French (fr)`, `German (de)`.
* **Timezone Selector**:
  * Dropdown: `UTC`, `America/New_York`, `Europe/London`, `Asia/Kolkata`.
* **App Display Theme**:
  * Radio / Button options: `Dark Mode`, `Light Mode`, `System Default`.
* **Decimal & Number Formatting**:
  * Decimal Precision: `2`, `3`, `4` places.
  * Financial Year Start Month: `January` vs `April`.
* **API Call**: `userService.updateUserPreferences(data)`.

---

### 🏠 Tab 4: Address & Billing Details (`AddressesTab.tsx`)
* **Address Cards Grid**:
  * List existing addresses with `HOME`, `BILLING`, `SHIPPING` badges.
  * Display: Street, City, State, Postal Code, Country.
  * Badges for `Primary Address` & `Billing Address`.
* **Modal / Form for Add/Edit Address**:
  * Input fields for `street`, `city`, `state`, `postalCode`, `country`.
  * Checkboxes for `isPrimary` and `isBilling`.

---

### 🔔 Tab 5: Notification Preferences (`NotificationsTab.tsx`)
* **Toggles for Communication Channels**:
  * `emailNotifications` (Email Statements & Export Alerts)
  * `pushNotifications` (Real-time Portfolio & Security Triggers)
  * `marketingEmails` (Product Updates & Tips)

---

## 🛠️ 5. API Service Methods to Use

All necessary API client functions are pre-built in `src/services/user.service.ts` and `src/services/auth.service.ts`:

```typescript
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';

// 1. Fetch Current User Profile
const profileRes = await userService.getCurrentUser();

// 2. Update Profile
await userService.updateProfile({ firstName, lastName, phoneNumber, avatarUrl });

// 3. Fetch User Preferences
const prefsRes = await userService.getUserPreferences();

// 4. Update Preferences
await userService.updateUserPreferences({ currency: 'USD', theme: 'dark' });

// 5. Fetch Active Sessions
const sessions = await userService.getActiveSessions();

// 6. Revoke Session
await userService.revokeSession(sessionId);

// 7. Change Password
await authService.changePassword({ currentPassword, newPassword });
```

---

## ✅ 6. Acceptance Criteria

- [ ] All forms validate inputs using `zod` schemas and `react-hook-form`.
- [ ] Displays loading spinners (`isLoading`) during API requests.
- [ ] Shows success/error toast notifications via `sonner` (`toast.success()`, `toast.error()`).
- [ ] Responsive design supporting Mobile (<640px), Tablet, and Desktop resolutions.
- [ ] Supports both Light and Dark mode seamlessly (`dark:` Tailwind classes).
- [ ] Code passes `npx tsc --noEmit` with zero TypeScript errors.
