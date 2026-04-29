# Database Architecture and Data Management

This document outlines the database structure, data manipulation patterns, and the flow of information within the application.

## 1. Database Architecture
The application uses **Supabase (PostgreSQL)** as its primary data store. The database is organized into several key tables that support the agricultural ecosystem.

### Key Tables
- **`profiles`**: Stores user-specific data (Farmers and Buyers). It extends Supabase Auth data.
- **`products`**: Marketplace listings created by Farmers. Includes stock management and health status.
- **`diagnoses`**: AI-driven crop health analysis results powered by Gemini.
- **`orders` & `order_items`**: Handles the transaction lifecycle from farmer to consumer.
- **`notifications`**: Real-time activity center for orders, system alerts, and market trends.
- **`sensor_data`**: High-frequency environmental data (Soil moisture, humidity, etc.).
- **`messages`**: Peer-to-peer communication between farmers and buyers.

## 2. Data Manipulation (Service Layer)
All database interactions are abstracted into a central service layer located at `src/services/supabaseService.ts`.

### pattern: The Service Object
The `supabaseService` object provides a clean API for components to interact with data without knowing the underlying SQL or table structures.

```typescript
// Example: Fetching products with join data
async getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, profiles(full_name, avatar_url, is_verified)');
  
  if (error) throw new Error(error.message);
  return data;
}
```

## 3. Querying and Data Passing
The application follows a **Provider-Consumer pattern** for state and data management.

### Data Flow
1.  **Request**: A component (e.g., `MarketplaceGrid`) calls a service method.
2.  **Service**: `supabaseService` performs a query via the Supabase client.
3.  **Result**: Data is returned as strongly-typed objects (defined in `src/types/models.ts`).
4.  **State**: Typically managed within a component's `useState` or a global context like `UserContext`.
5.  **UI**: Components render the data, often using Framer Motion for transitions.

### Complex Queries (Joins)
We use PostgREST's relational querying to fetch nested data in a single request, reducing latency:
```typescript
// Fetching orders with their items and the related product/farmer info
.select(`
  *,
  order_items (
    *,
    products (*, profiles:farmer_id(*))
  )
`)
```

## 4. Real-time Capabilities
The app leverages **Postgres Change Data Capture (CDC)** for instant updates.

- **Sensor Data**: Farmers see live updates from their fields using `supabase.channel().on('postgres_changes', ...)`.
- **Notifications**: Users receive instant alerts when orders are processed or stock is low.
- **Chat**: Messages appear instantly in the chat interface via real-time subscriptions.

## 5. Security (Row Level Security)
Security is enforced at the database level using **PostgreSQL Policies (RLS)**.

- **Isolation**: Farmers can only update their own products.
- **Privacy**: Only the buyer or the related farmer can see specific order details.
- **Integrity**: Deleting an account cascades to all related products and diagnoses.

## 6. Setup and Maintenance
The full schema, including RLS policies, functions, and triggers, is maintained in `/supabase-schema.sql`. This file serves as the blueprint for reproducing the production environment.
