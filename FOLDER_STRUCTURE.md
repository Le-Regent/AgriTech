# AgriTech Pro - Folder Structure and File Roles

This document outlines the directory structure of the AgriTech Pro application and describes the role of each key file.

## Directory Structure

```text
/
├── app/                    # Next.js App Router (moved to src/app)
├── public/                 # Static assets (images, icons, etc.)
├── src/                    # Source code
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── api/            # API routes (if any)
│   │   ├── cart/           # Shopping cart page
│   │   ├── checkout/       # Checkout process page
│   │   ├── components/     # App-specific components (Layout, ProtectedRoute, etc.)
│   │   ├── diagnosis/      # AI Crop Diagnosis pages
│   │   ├── history/        # Activity/Transaction history pages
│   │   ├── listings/       # User's product listings page
│   │   ├── login/          # Authentication (Login/Signup) page
│   │   ├── marketplace/    # Marketplace and product detail pages
│   │   ├── messages/       # Messaging/Chat page
│   │   ├── orders/         # Order history page
│   │   ├── profile/        # User profile management page
│   │   ├── welcome/        # Landing/Welcome page
│   │   ├── globals.css     # Global Tailwind CSS styles
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Main dashboard page
│   │   └── providers.tsx   # Context providers wrapper
│   ├── components/         # Reusable UI components
│   │   ├── marketplace/    # Marketplace-specific components (ProductCard)
│   │   ├── ui/             # Basic UI components (if any)
│   │   ├── Navbar.tsx      # Top navigation bar
│   │   ├── Sidebar.tsx     # Side navigation menu
│   │   ├── BottomNav.tsx   # Mobile bottom navigation
│   │   ├── ResponsiveImage.tsx # Optimized image component
│   │   ├── ProductModal.tsx # Modal for adding/editing products
│   │   ├── OnboardingTour.tsx # User onboarding guide
│   │   └── SyncManager.tsx  # Offline data synchronization manager
│   ├── context/            # React Context for state management
│   │   ├── UserContext.tsx # Authentication and user profile state
│   │   ├── CartContext.tsx # Shopping cart state
│   │   ├── NotificationContext.tsx # App notifications state
│   │   ├── OfflineContext.tsx # Offline mode and sync queue state
│   │   └── ThemeContext.tsx # Dark/Light mode state
│   ├── lib/                # Library configurations and utilities
│   │   ├── supabase.ts     # Supabase client initialization
│   │   ├── weatherService.ts # Weather API integration
│   │   └── diagnosisUtils.ts # Utilities for crop diagnosis
│   ├── services/           # Backend service abstractions
│   │   ├── supabaseService.ts # Database and Auth operations
│   │   └── profileService.ts  # User profile specific operations
│   ├── constants.ts        # Application constants and mock data
│   └── types.ts            # TypeScript interfaces and types
├── .env.example            # Example environment variables
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Key File Roles

### `src/app/layout.tsx`
The root layout that wraps all pages. It includes global styles, font configurations, and the `Providers` component.

### `src/app/providers.tsx`
A client-side component that wraps the application with all necessary React Context providers (User, Cart, Theme, etc.).

### `src/app/page.tsx`
The main dashboard page for authenticated users. It shows farm stats, weather, and recent activity. If the user is not logged in, it renders the `LandingPage`.

### `src/context/UserContext.tsx`
Manages the authentication state using Supabase Auth. It handles login, signup, logout, and provides the current user's profile data.

### `src/services/supabaseService.ts`
Contains all the logic for interacting with the Supabase database, including fetching products, creating orders, and managing messages.

### `src/components/ResponsiveImage.tsx`
A wrapper around the Next.js `Image` component that ensures proper aspect ratios and handles referrer policies for external images.

### `src/context/OfflineContext.tsx`
Implements offline support by tracking network status, caching data in `localStorage`, and managing a synchronization queue for actions performed while offline.

### `src/components/SyncManager.tsx`
A background component that listens for online status changes and triggers the synchronization of queued offline actions.

### `src/app/components/ProtectedRoute.tsx`
A higher-order component used to restrict access to pages based on authentication status and user roles (farmer/buyer).
