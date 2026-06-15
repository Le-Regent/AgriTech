# KamerFresh - Codebase Documentation

This document provides an overview of the folder structure and the role of each key file in the KamerFresh application.

## Folder Structure

### `/app`
Next.js App Router directory containing all the routes and page-level components.
- `layout.tsx`: Root layout component that wraps all pages.
- `page.tsx`: The home/dashboard page.
- `providers.tsx`: Wraps the application with necessary context providers (Auth, User, Cart, etc.).
- `(auth)/`: Route group for authentication-related pages (login, signup).
- `cart/`: Shopping cart and checkout flow.
- `diagnosis/`: AI-powered crop disease diagnosis tool.
- `history/`: User activity and transaction history.
- `insights/`: Market trends and analytics for farmers.
- `listings/`: Management page for farmer product listings.
- `logistics/`: Supply chain and delivery tracking.
- `marketplace/`: Product discovery and browsing.
- `messages/`: Real-time chat system.
- `profile/`: User profile management.

### `/src`
Contains shared components, logic, and configuration.
- `components/`: Reusable UI components.
  - `Navbar.tsx`: Main navigation bar.
  - `Sidebar.tsx`: Side navigation for dashboard views.
  - `ProductModal.tsx`: Unified modal for adding and editing products.
  - `ResponsiveImage.tsx`: Optimized image component for different screen sizes.
- `context/`: React Context providers for global state management.
  - `UserContext.tsx`: Manages user profile and authentication state.
  - `CartContext.tsx`: Handles shopping cart operations.
  - `NotificationContext.tsx`: Manages real-time alerts and notifications.
  - `OfflineContext.tsx`: Handles offline data persistence and synchronization.
- `services/`: External service integrations.
  - `supabaseService.ts`: Centralized logic for Supabase database and storage operations.
- `lib/`: Utility functions and library configurations.
  - `utils.ts`: Common helper functions.
- `types.ts`: TypeScript interfaces and types used across the project.
- `constants.ts`: Static data, navigation configurations, and initial mock data.

### Root Directory
- `metadata.json`: Application metadata (name, description, permissions).
- `firebase-blueprint.json`: Data structure definition for Firebase (if used).
- `firestore.rules`: Security rules for Firestore (if used).
- `package.json`: Project dependencies and scripts.
- `tailwind.config.ts`: Tailwind CSS configuration.

## Key File Roles

| File | Role |
|------|------|
| `src/services/supabaseService.ts` | The primary interface for all database CRUD operations and file uploads. |
| `src/context/UserContext.tsx` | Ensures user data is available throughout the app and handles profile updates. |
| `src/components/ProductModal.tsx` | A complex, multi-purpose modal used for listing management and marketplace interactions. |
| `src/context/NotificationContext.tsx` | Handles the logic for showing alerts, including auto-dismissal and timed simulations. |
| `app/marketplace/page.tsx` | The main entry point for buyers to browse and interact with products. |
| `app/listings/page.tsx` | The central hub for farmers to manage their inventory. |
| `src/types.ts` | The source of truth for data structures like `Product`, `Profile`, and `Order`. |

## Production Deployment & Hosting

KamerFresh is officially deployed and hosted on **Vercel** serverless infrastructure:
- **Production URL:** [https://kamerfresh.vercel.app/](https://kamerfresh.vercel.app/)
- **Infrastructure Architecture:** 
  - **Static & SSR Assets:** Distributed via Vercel's global Content Delivery Network (CDN) to ensure low-latency loading profiles even under rural Cameroonian 3G bandwidth bottlenecks.
  - **Server-Side API Routing:** Next.js App Router API endpoints (e.g., `/api/ai/diagnose`) are executed on Vercel Serverless Functions, keeping sensitive environment credentials (such as `GEMINI_API_KEY` and Supabase service keys) completely secure and invisible to browser clients.
  - **Continuous Integration (CI/CD):** Integrated via GitHub actions and automated Vercel pull-request preview building configurations.

---
*Last updated: June 3, 2026*
