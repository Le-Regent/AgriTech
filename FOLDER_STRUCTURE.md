# AgriFlow - Folder Structure and File Roles

This document outlines the directory structure of the AgriFlow application and describes the role of each key file.

## Directory Structure

```text
/
├── .env.example            # Example environment variables
├── metadata.json           # Application metadata (name, description, permissions)
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── supabase-schema.sql     # SQL for database initialization
├── tsconfig.json           # TypeScript configuration
├── src/                    # Source code
│   ├── app/                # Next.js App Router root
│   │   ├── cart/           # Shopping cart page
│   │   ├── checkout/       # Checkout process page
│   │   ├── components/     # App-specific components (AuthGuard, etc.)
│   │   ├── diagnosis/      # AI Crop Diagnosis pages
│   │   ├── forgot-password/ # Password recovery page
│   │   ├── globals.css     # Global Tailwind CSS styles
│   │   ├── history/        # Activity/Transaction history pages
│   │   ├── layout.tsx      # Root layout
│   │   ├── listings/       # User's product listings page
│   │   ├── login/          # Authentication (Login/Signup) page
│   │   ├── logistics/      # Delivery and route tracking page
│   │   ├── marketplace/    # Marketplace and product detail pages
│   │   ├── messages/       # Messaging/Chat page
│   │   ├── not-found.tsx   # Custom 404 page
│   │   ├── orders/         # Order tracking page
│   │   ├── page.tsx        # Main dashboard page
│   │   ├── profile/        # User profile management page
│   │   ├── providers.tsx   # Context providers wrapper
│   │   ├── reset-password/ # Password reset confirmation page
│   │   └── welcome/        # Landing/Welcome page
│   ├── components/         # Reusable UI components
│   │   ├── marketplace/    # Marketplace-specific components (ProductCard)
│   │   ├── BottomNav.tsx   # Mobile bottom navigation
│   │   ├── Layout.tsx      # Main layout wrapper component
│   │   ├── Navbar.tsx      # Top navigation bar
│   │   ├── OnboardingTour.tsx # User onboarding guide
│   │   ├── ProductModal.tsx # Modal for adding/editing products
│   │   ├── Providers.tsx   # Component-level providers
│   │   ├── ResponsiveImage.tsx # Optimized image component
│   │   ├── Sidebar.tsx     # Side navigation menu
│   │   ├── Skeleton.tsx    # Loading state skeleton placeholders
│   │   └── SyncManager.tsx  # Offline data synchronization manager
│   ├── context/            # React Context for state management
│   │   ├── CartContext.tsx # Shopping cart state
│   │   ├── NotificationContext.tsx # App notifications state
│   │   ├── OfflineContext.tsx # Offline mode and sync queue state
│   │   ├── ThemeContext.tsx # Dark/Light mode state
│   │   └── UserContext.tsx # Authentication and user profile state
│   ├── lib/                # Library configurations and utilities
│   │   ├── diagnosisUtils.ts # Utilities for crop diagnosis
│   │   ├── supabase.ts     # Supabase client initialization
│   │   ├── unitUtils.ts     # Weight and quantity conversion utilities
│   │   └── weatherService.ts # Weather API integration
│   ├── services/           # Backend service abstractions
│   │   ├── messageService.ts # Chat logic
│   │   ├── orderService.ts  # Order fulfillment logic
│   │   ├── productService.ts # Product management logic
│   │   ├── profileService.ts # User profile specific operations
│   │   ├── storageService.ts # File/Image upload logic
│   │   └── supabaseService.ts # Core database operations
│   ├── constants.ts        # Application constants and mock data
│   └── types.ts            # TypeScript interfaces and types
```

## Key File Roles

### `src/app/layout.tsx`
The root layout that wraps all pages. It includes global styles, font configurations, theme logic, and the `Providers` component.

### `src/app/providers.tsx`
A client-side component that wraps the application with all necessary React Context providers (User, Cart, Theme, etc.).

### `src/app/page.tsx`
The main dashboard page for authenticated users. It shows real-time stats, weather, and recent activity (Farmer or Buyer view).

### `src/context/UserContext.tsx`
Manages the authentication state using Supabase Auth. It handles login, signup, logout, and provides the current user's profile data.

### `src/services/supabaseService.ts`
Contains all the logic for interacting with the Supabase database, including fetching products, creating orders, and managing notifications.

### `src/components/Skeleton.tsx`
Provides consistent loading placeholders while data is being fetched, improving the perceived performance and UX.

### `src/context/OfflineContext.tsx`
Implements offline support by tracking network status, caching data in `localStorage`, and managing a synchronization queue for actions performed while offline.
