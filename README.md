# KamerFresh - Sustainable Agritech Marketplace & Farm Management

KamerFresh is a high-performance agricultural marketplace, logistics, security, and farm management platform specifically engineered for smallholder farmers and agricultural buyers. It unifies server-side generative artificial intelligence, secure geoprogressive escrow transactions, and speech synthesis interfaces to optimize the agricultural supply chain in developing markets (e.g., Sub-Saharan Africa/Cameroon).

## 🚀 Live Production Instance
The application is fully hosted on **Vercel's Edge Serverless Network**:
- **Production URL:** [https://kamerfresh.vercel.app/](https://kamerfresh.vercel.app/)
- **Database Engine:** Supabase PostgreSQL Cloud Instance (Postgres 15) with strict Row-Level Security isolation.

---

## 🛠️ Specialized Architectural Modules

1. **AI Crop Disease Diagnosis & Botanical Identification (Gemini 3.5 Flash)**
   - Fully server-side diagnosis system using standard `@google/genai` to prevent API key leakages.
   - Detects plant diseases and outputs precise treatment regimens directly from device camera streams, drag-and-drop file transfers, or local galery buffers.
   - Identifies crops zero-shot format under a generalized "Other" classification wrapper.

2. **Secure Geoprogressive Escrow Ledger System**
   - Transacts secure escrow state machines to prevent payments default (`offered` -> `escrow_locked` -> `disbursed`).
   - Integrates georouting protocols along the critical Bamenda - Bafoussam - Douala transport corridors.
   - Authorizes courier deliveries using a secure 2-factor OTP (One-Time Password) confirmation handshake.

3. **High-Performance Offline Cache Synchronization (PWA Foundation)**
   - Uses `idb-keyval` (IndexedDB engine) to cache critical screens, pending sales listings, and transaction profiles directly on browser storage.
   - Smoothly processes background task queues, allowing farmers to compose listings, write settings, and catalog crops even when offline.

4. **Speech-Synthesis Accessibility Core (HTML5 Voice)**
   - Generates fully narrated agronomic reports, disease warning briefings, and market parameters natively within the client browser.
   - Circumvents network costs or latency.

---

## 💻 Tech Stack & Dependencies

- **Framework:** Next.js (15+ with App Router) and React 19.
- **Language:** TypeScript (Type-safe and strictly compiled).
- **Styling & UI:** Tailwind CSS v4.0 with optimized browser performance.
- **Data Layers:** Supabase JS SDK & PostgreSQL with WebSocket Real-Time CDC.
- **Physics & Animation Library:** `motion` (`motion/react`) for spring-driven UI responsiveness.
- **Charts and Visualization:** Recharts, D3.js and customizable analytics dashboards.

---

## 📝 Technical Documentation & Guides
This codebase includes several technical guides to help with ongoing development, system architecture, and maintenance:
* [CODEBASE.md](./CODEBASE.md) - Codebase folder structure and key file roles.
* [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database schema design, querying patterns, and security (RLS).
* [PAYMENT_SYSTEM.md](./PAYMENT_SYSTEM.md) - Payment system workflow, integration parameters, and event logging.
* [SECURITY.md](./SECURITY.md) - Security guidelines and policies.
* [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Comprehensive directory layout references.

---

## ⚙️ Local Development Setup & Configuration

Follow these steps to set up the development environment locally:

### 1. Install Dependencies
Install all required Node.js packages:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template file `.env.example` to create your local `.env` configuration:
```bash
cp .env.example .env
```

Now, populate the `.env` file with your credentials. Below is a detailed breakdown of how each variable is implemented and where to obtain them:

#### 🔹 Supabase Configuration (Backend & Real-Time)
The platform uses Supabase for user authentication, PostgreSQL database storage, and real-time WebSockets.
*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (found under **Project Settings > API** in your Supabase dashboard).
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous client key used by the Next.js frontend to securely access database tables adhering to Row-Level Security (RLS) policies.
*   `SUPABASE_SERVICE_ROLE_KEY`: A high-privilege administrative key used **strictly server-side** for admin operations (e.g., executing system overrides, database triggers, or bypasses). *Never expose this key on the client.*

#### 🔹 Generative AI (Gemini 3.5 Flash)
*   `GEMINI_API_KEY`: Used for crop disease diagnosis and botanical identification. This is a private server-side key obtained from Google AI Studio. It is accessed exclusively via the Next.js API routes (`/api/ai/*`) to prevent browser-side exposure.

#### 🔹 Weather & Agronomic Insights
*   `OPENWEATHER_API_KEY`: Used to query high-fidelity forecasts and environmental indicators for farmers. Get this from your OpenWeather account dashboard.

#### 🔹 Mobile Money Payments (Campay API)
Campay is integrated to process Cameroon mobile money (MTN / Orange) transactions.
*   `CAMPAY_APP_ID`: Your Campay Application ID.
*   `CAMPAY_APP_USERNAME`: Your Campay API username.
*   `CAMPAY_APP_PASSWORD`: Your Campay API password.
*   `CAMPAY_PERMANENT_TOKEN`: Your permanent API access token (used in headers to authenticate requests securely).
*   `CAMPAY_WEBHOOK_SECRET`: Secure cryptographic token used to verify that inbound transaction callbacks to `/api/payment/webhook` originate from Campay.
*   `CAMPAY_ENVIRONMENT`: Set to `dev` for sandbox testing or `prod` for live transactions.

---

### 3. Start Development Server
Boot the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Production Verification
Verify that the TypeScript compiler and Next.js bundle successfully compile without errors:
```bash
npm run build
```
