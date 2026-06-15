# Intelligent Inventory & Freshness Tracking System

This system automates the lifecycle of farm produce to reduce food waste and ensure market quality.

## Core Features

### 1. Freshness Monitoring
- **Perishable Logic**: Products marked as `is_perishable` require an `expiry_date`.
- **Status Stages**:
  - **Perfect**: Freshly listed (>60% shelf life).
  - **Good**: Safe for sale (25% - 60% shelf life).
  - **Warning**: 10% - 25% shelf life remaining. Triggers a notification to suggest a discount.
  - **Critical**: <10% shelf life or <24h remaining. Triggers an urgent alert and "Last Chance" badge on the marketplace.

### 2. The Kill Switch (Auto-Archiving)
When a product reaches its `expiry_date`, the system:
1. Removes it from the active marketplace.
2. Logs the entry into `waste_analytics` (storing quantity and estimated financial loss).
3. Notifies the farmer that the item has been removed.

### 3. Automated Background Scan
The system relies on an external trigger to the following endpoint:
`GET /api/inventory/scan?secret=YOUR_SCAN_SECRET`

**Setup Instructions:**
1. Set `INVENTORY_SCAN_SECRET` in your environment variables.
2. Configure a Cron Job (e.g., via GitHub Actions, Vercel Cron, or a dedicated provider) to hit the endpoint hourly.

## Database Structure
- `products`: Extended with `is_perishable` and `expiry_date`.
- `waste_analytics`: Stores archived expired goods for loss reporting.

## UI Components
- **Marketplace Badges**: Intelligent badges ("Expiring Soon", "Last Chance") appear automatically based on calculated freshness.
- **Waste Logs**: A dedicated dashboard for farmers to track financial losses from expired inventory.
