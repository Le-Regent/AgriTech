# Agro-Cam Payment System & Escrow Architecture

This document explains the payment flow, escrow security, and disbursement logic integrated into the Agro-Cam platform.

## 1. Overview
Agro-Cam uses an **Escrow-Based Peer-to-Peer (P2P)** payment model. This ensures that farmers only get paid once the buyer confirms receipt of the goods, and buyers' funds are secured by the platform until the "Handshake" is complete.

## 2. Technology Stack
- **Gateway**: [Campay](https://www.campay.net/) (Specialized in CEMAC region mobile money: MTN & Orange).
- **Escrow Database**: Supabase (Transaction state management).
- **Server Environment**: Next.js API Routes (Secure token handling & signing).

---

## 3. The Payout Lifecycle

### Step 1: Collection (Buyer Side)
When a buyer checks out, they initiate a **Collect** request via Campay.
- **Protocol**: Mobile Money Prompt (USSD/Push).
- **Status Update**: Upon successful payment, the order status moves to `ESCROW_HELD`.
- **Funds Destination**: Funds are stored in the Agro-Cam Platform Wallet (not sent directly to the farmer yet).

### Step 2: Transit (Farmer Side)
The farmer prepares the order and uploads a **Waybill/Evidence** (photo).
- **Status Update**: Order status moves to `shipped`.
- **Notification**: Buyer receives a notification with the delivery tracking image.

### Step 3: Verified Delivery (Handshake)
At the point of delivery, the buyer provides a unique **OTP/Confirmation Code** to the farmer.
- **Verification**: The farmer enters this code in their dashboard.
- **Validation**: If the code matches the record in Supabase, the order status moves to `delivered`.
- **Role**: This confirms that the buyer has the product in hand.

### Step 4: Disbursement (Admin Vault)
Admins monitor the **Escrow Vault** to see orders marked as `delivered`.
- **Commission**: The platform calculates the disbursement amount (e.g., 95% to the farmer, 5% platform fee).
- **Payout**: Admin triggers the **Withdrawal API** (Campay) to move funds from the platform wallet to the farmer's mobile money account.
- **Status Update**: Order status moves to `COMPLETED`.

---

## 4. Security Measures

### A. Server-Side Keys
All Campay interactions (Tokens, Collects, Withdrawals) happen exclusively in **Server Components** or **API Routes**. 
- `CAMPAY_APP_USERNAME` / `CAMPAY_APP_PASSWORD` are never exposed to the browser.
- Permanent tokens are used on the server to prevent brute-force auth attempts on the gateway.

### B. The Handshake Protocol (OTP)
Funds are only released if the buyer provides the secret code. This prevents "phantom deliveries" where a farmer might claim they shipped a product that never arrived.

### C. Admin Verification
The custom **Escrow Vault** (/admin/escrow) provides a final human-in-the-loop verification step for large disbursements, ensuring platform health and preventing fraudulent payouts.

---

## 5. Configuration (Environment Variables)

To activate the payment system, the following keys must be set:

```env
# Campay Configuration
CAMPAY_APP_ID=...
CAMPAY_APP_USERNAME=...
CAMPAY_APP_PASSWORD=...
CAMPAY_PERMANENT_TOKEN=...
CAMPAY_WEBHOOK_SECRET=...
CAMPAY_ENVIRONMENT=dev  # or 'prod'
```

## 6. Maintenance & Logs
- **Payment Logs**: All transaction references are stored in the `payments` table in Supabase.
- **Failures**: If a payout fails due to insufficient platform balance, the Admin Vault will display a "Platform Balance Error" and log it to the system health monitor.
