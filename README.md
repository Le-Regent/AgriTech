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

## 📝 Dissertation Research Chapters
This codebase is supplemented by a complete research dissertation, providing extensive benchmarks for low-latency systems in limited access zones:
* [CHAPTER 1: INTRODUCTION](./CHAPTER_1_INTRODUCTION.md)
* [CHAPTER 2: LITERATURE REVIEW](./CHAPTER_2_LITERATURE_REVIEW.md)
* [CHAPTER 3: MATERIALS AND METHODS](./CHAPTER_3_MATERIALS_AND_METHODS.md)
* [CHAPTER 4: RESULTS AND DISCUSSIONS](./CHAPTER_4_RESULTS_AND_DISCUSSIONS.md)
* [RESEARCH_DOCUMENT.md](./RESEARCH_DOCUMENT.md)
* [SRS.md](./SRS.md)
* [CODEBASE.md](./CODEBASE.md)
* [PROGRESS.md](./PROGRESS.md)
* [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)

---

## ⚙️ Local Development Setup

1. **Clone & Install packages:**
   ```bash
   npm install
   ```
2. **Environment Configuration:**
   Configure a `.env` file referencing variables defined in `.env.example`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_client_key
   GEMINI_API_KEY=your_google_genai_key
   ```
3. **Boot Development Environment:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to browse.

4. **Compile Build Script:**
   ```bash
   npm run build
   ```
