# CHAPTER 3: MATERIALS AND METHODS

## 3.1 Introduction
This chapter explains the technological materials, research design, systemic architecture, algorithms, database schematics, and functional implementation protocols used to construct and evaluate the **INTEGRATED CONTEXT-AWARE WEB SYSTEM FOR SUSTAINABLE AGRITECH**. Our core design philosophy centers on architectural transparency, low-bandwidth resilience, and trusted transactional pathways tailored to the Cameroonian agrarian landscape. 

---

## 3.2 System Architecture Overview
The system adopts an asynchronous **Full-Stack Serverless-Service Archetype** (Figure 3.1) utilizing a unified Next.js App Router host, a Supabase PostgreSQL backend as the transactional state engine, and Google's Gemini Multi-modal Large Language Model (LMM) as an on-demand plant doctor services proxy.

```
+---------------------------------------------------------------------------------+
|                                 CLIENT SIDE                                     |
|                                                                                 |
|   +----------------------------+             +-------------------------------+  |
|   |   Dynamic Onboarding Hub   |     PWA     |    Responsive Dual-Grid       |  |
|   |   (Farmer / Buyer Slide)   |<----------->|    Marketplace View Cards     |  |
|   +----------------------------+   Caching   +-------------------------------+  |
|                  ^                                           ^                  |
|                  | Interaction                               | Render           |
|                  v                                           v                  |
|   +----------------------------+             +-------------------------------+  |
|   |    AI Leaf Diagnosis UI    |             |    Interactive Geolocation    |  |
|   |    & Offline Image Store   |             |    Logistics Mapping Panel    |  |
|   +----------------------------+             +-------------------------------+  |
+------------------^-------------------------------------------^------------------+
                   |                                           |
                   | Secured REST API / JSON                   | Real-time CDC (Websockets)
                   v                                           v
+------------------v-------------------------------------------v------------------+
                   |   MIDDLEWARE SERVER-SIDE ROUTER (Next.js)                 |
                   |   Secure TLS Proxy to Gemini / DB Connections              |
+------------------^-------------------------------------------^------------------+
                   |                                           |
                   | JSON Payload                              | Query Sync
                   v                                           v
+------------------v--------------+             +--------------v------------------+
|      FOUNDATIONAL AI LAYER      |             |     PERSISTENT DB (Supabase)     |
|   Google GenAI SDK Engine       |             |   PostgreSQL Engine / Auth      |
|   - Zero-Shot Plant Diagnosis   |             |   - Row-Level Security Rules    |
|   - Auto-Species Identification |             |   - Transposed Escrow States    |
+---------------------------------+             +---------------------------------+
```
*Figure 3.1: KamerFresh Interactive Conceptual Architecture*

---

## 3.3 Hardware and Software Materials (System Specifications)

### 3.3.1 Engineering & Development Toolchain
The following software assets and developer tools form the basis of the system's pipeline:
- **Programming Language:** TypeScript (v5.0+), providing strict compile-time type-safety and interface validation.
- **Frontend Framework:** Next.js (v15.0+ with App Router), facilitating hybrid server-side rendering (SSR), static generation (SSG), and secure backend API routes.
- **Styling Architecture:** Tailwind CSS (v4.0), running a specialized compilation engine via `@tailwindcss/postcss`.
- **Database Backend:** Supabase (PostgreSQL 15), providing database-level row-level security (RLS), real-time tables via web sockets, and encrypted asset buckets.
- **AI Core:** Google GenAI TypeScript SDK, connecting to `gemini-3.5-flash` for multi-modal computer vision and classification reasoning.
- **Mapping & Geodesy:** React-Leaflet and Leaflet SDK, plotting GPS coordinates over OpenStreetMap tiles.

### 3.3.2 Physical Deployment Targets
To validate rural operational feasibility in Cameroon, test viewports and responsive layouts are assessed against:
- **Lower Tier (Rural Target):** Android client (Chrome Mobile v115), 6.1" display, restricted to simulated 3G Edge speeds (300kbps - 1.2Mbps).
- **Core Desktop (Admin/Wholesale Target):** Desktop web browser (Chrome/Safari), 1080p viewport, high-bandwidth connection.

---

## 3.4 Database Schema Design and Row-Level Security Rules

The data model uses normalized relational models implemented as PostgreSQL tables. It utilizes Postgres trigger hooks for automated telemetry updates, alongside Row-Level Security (RLS) policies to enforce isolation between buyers, farmers, and administrators.

### 3.4.1 SQL Schema Definitions (Unified DDL Specs)
```sql
-- Profile database with strict user role assertions
CREATE TYPE user_role AS ENUM ('farmer', 'buyer');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    user_type user_role,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crop Diagnostics storage with Dynamic Unspecified Plant species columns
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    detected_crop_type TEXT, -- Populated if crop_type was entered as 'Other'
    image_url TEXT NOT NULL,
    result_label TEXT NOT NULL,
    confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    description TEXT NOT NULL,
    symptoms TEXT[] NOT NULL,
    treatment_steps TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products tables with initial stock depreciation counters
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    unit TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    initial_stock_quantity INTEGER NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'Other',
    freshness_level TEXT NOT NULL CHECK (freshness_level IN ('Excellent', 'Good', 'fair', 'Critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4.2 Row-Level Security (RLS) Integrity Enclosures
To prevent security breaches, database security rules are executed directly inside the Postgres layer. The system enforces policy isolation using the following configuration patterns:
- **`profiles_read_all`**: Any logged-in user can query other public profile names to facilitate marketplace interactions.
- **`products_modify_owner`**: A farmer can create, update, or delete products if and only if `auth.uid() = farmer_id` and their profile `user_type = 'farmer'`.
- **`diagnoses_read_self`**: Crop diagnosis records are strictly confidential and restricted. A query returns rows if and only if `auth.uid() = farmer_id`.
- **`admin_panel_block`**: In modern compliance paradigms, frontend bypasses are eliminated. Only users whose `profiles.is_admin` is explicitly evaluated to `TRUE` can bypass RLS limits. Frontend routes execute a server-side pre-flight assertion of `is_admin` before rendering administrative tables.

---

## 3.5 AI Crop Diagnosis & Botanical Identification Algorithm

When a farmer submits an image of a leaf displaying pathological patterns, the system cannot rely on the user knowing the host plant species. The diagnostic backend must be capable of dual-mode deduction:
1. **Targeted Diagnosis Mode:** Used when the farmer selected a specific crop class (e.g., Maize).
2. **Identification-Led Diagnostic Mode:** Triggered when the user leaves the species empty or selects "Other."

### 3.5.1 Automated Identification and Diagnosis Pipeline (Algorithm 3.1)

```
========================================================================================
ALGORITHM 3.1: Deep Foundational Identification and Multi-Modal Diagnosis Pipeline
========================================================================================
INPUT:  img_b64 (Base64 string representing compressed JPEG crop tissue scan)
        selected_crop (Scalar string representing user category choice, or 'Other')
        weather_data (JSON payload detailing ambient humidity, wind, and temp)
OUTPUT: Structured JSON report validating Host Plant Species and Pathological Health Metrics
========================================================================================

1.  PROCEDURE process_scan(img_b64, selected_crop, weather_data):
2.      IF img_b64 IS Empty THEN RETURN ERROR_CODE(400, "Missing photographic data");
3.      
4.      COMPRESS img_b64 using canvas-based pixel sampling to target payload size < 500KB;
5.      EXTRACT sub-regional weather markers (wind_speed, humidity_percent, temperature_celsius);
6.      
7.      // Construct context-enriched prompts for Gemini Vision engine
8.      prompt_base := "Analyze this plant leaf tissue image for systemic diseases. Provide recommendations."
9.      
10.     IF selected_crop EQUALS 'Other' THEN:
11.         prompt_injection := "If selected_crop input is 'Other', identify the specific plant 
12.                             or crop type from the image (e.g. Cassava, Plantain, Mango, Groundnut, etc.) 
13.                             and specify it inside the JSON field 'detectedCropType'. 
14.                             Set the host species variable dynamically."
15.     ELSE:
16.         prompt_injection := "Set 'detectedCropType' to standard name: " + selected_crop;
17.     ENDIF
18.     
19.     full_prompt := prompt_base + prompt_injection + "Weather Context: " + FormatJSON(weather_data);
20.     
21.     // Configure Google GenAI structured response formatting schema definitions
22.     json_schema := DEFINED_SCHEMA({
23.          diseaseName: STRING,
24.          scientificName: STRING,
25.          detectedCropType: STRING,
26.          confidence: NUMBER [0.0 to 1.0],
27.          status: ENUM['healthy', 'warning', 'critical'],
28.          description: STRING,
29.          symptoms: ARRAY[STRING],
30.          treatmentSteps: ARRAY[STRING],
31.          causes: ARRAY[STRING],
32.          preventions: ARRAY[STRING],
33.          environmentalContext: STRING
34.     }, REQUIRED=["diseaseName", "detectedCropType", "confidence", "status", "description", "treatmentSteps"]);
35.     
36.     // Call LMM Vision SDK model endpoint (Server-Side Context Enclosure)
37.     response_object := CALL_GEMINI_ENDPOINT(
38.         model="gemini-3.5-flash",
39.         contents=[ConvertToPart(img_b64, mime="image/jpeg"), full_prompt],
40.         config=GenerationConfig(responseMimeType="application/json", responseSchema=json_schema)
41.     );
42.     
43.     parsed_report := ParseJSON(response_object.text);
44.     
45.     // Persistence to database
46.     EXECUTE_SECURE_INSERT INTO TABLE diagnoses VALUES(
47.          farmer_id := auth.uid(),
48.          crop_type := selected_crop,
49.          detected_crop_type := parsed_report.detectedCropType,
50.          image_url := img_b64,
51.          result_label := parsed_report.diseaseName,
52.          confidence := parsed_report.confidence,
53.          status := parsed_report.status,
54.          description := parsed_report.description
55.     );
56.     
57.     RETURN parsed_report;
58.  END PROCEDURE
========================================================================================
```

---

## 3.6 Escrow Payment, Geolocation Routing and Logistics Protocols

To facilitate direct farm-to-table commerce, KamerFresh uses a **Simulated Multi-Step Handshake Protocol** linked to geospatial mapping coordinates. 

1. **Escrow Allocation:** When a buyer triggers checks, payments are captured and locked into a central ledger status table (`payment_status = 'escrow'`).
2. **Geospatial Route Generation:** Real-time logistics routes are plotted using Haversine Geodesic logic between known coordinates, tracking vehicles along simulated transit stages (Bamenda -> Mbouda -> Bafoussam -> Loum -> Douala).
3. **Delivery Verification Handshake:** A secure OTP (One-Time Password) transaction verification is sent to the buyer's system terminal. The carrier must physically prompt the buyer for this code. If and only if the code matches (`OTP_hash_match`), the transaction shifts state to `complete`, and funds are disbursed to the farmer's wallet.

---

## 3.7 Human-Centric Interface Engineering & Responsive Adaptations

Rural technology requires extreme UI simplicity. The implementation details two critical visual layout choices established directly during development cycles:

### 3.7.1 The Zero-Prompt Interactive Onboarding Hub
To reduce user friction for non-literate farmers or fast-paced shoppers, the app's gateway avoids starting with empty configurations or open conversational text fields. 
- The system embeds a layouts-contained **Dynamic Onboarding Board** featuring an interactive sliding pill design.
- The pill utilizes a spring physics animation model (`motion` framework with 380 stiffness and 30 damping) to slide seamlessly between **Farmer Mode** and **Buyer Mode**.
- Activating a mode displays corresponding high-impact cards that outline system entry actions (e.g., "AI Crop Diagnosis," "List & Sell Produce," "Fresh Food Marketplace") with explicit visual paths (deep links).

### 3.7.2 Mobile-Optimal Balanced Dual-Row Grid Density
To prevent scanning exhaustion on portrait-mode mobile screens:
- Single-column scrolling layouts are refactored into a **symmetric two-column layout** (`grid-cols-2`) on mobile viewports.
- Spacing gaps are shrunk (`gap-3`) to maximize screen usage, and image bounding containers are strictly enforced at a safe aspect ratio.
- Product images are forced to render permanently to ensure that food freshness indicators and product certifications are fully visible to potential buyers without clicking, keeping layout density consistent and intuitive.

---

## 3.8 Dual-Language Localization Methods
To address language constraints across Cameroon, all UI views utilize standard dictionary-based **English-French translation dictionaries**. React components consume translation state context dynamically, mapping visual outputs based on user profile settings (`en` or `fr`), preventing hardcoded language exclusions.

---

## 3.9 Summary of Chapter
Chapter 3 presents a complete, rigorous overview of the materials and methodology of the KamerFresh application. By combining the Google GenAI SDK's structured multi-modal inference, strict Supabase Postgres isolation rules, a geospatial coordinate router, and lightweight, mobile-optimal interactive configurations (Onboarding Hub & Dual-Grid layouts), KamerFresh establishes an inclusive, resilient, and highly secure paradigm for sustainable digital agriculture in developing markets.
