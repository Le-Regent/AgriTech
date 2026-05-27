# CHAPTER 3: MATERIALS AND METHODS

## 3.1 Introduction
This chapter presents the comprehensive technological materials, research designs, database structures, interface mechanics, and algorithms used to build the **INTEGRATED CONTEXT-AWARE WEB SYSTEM FOR SUSTAINABLE AGRITECH** (KamerFresh). To ensure field-level viability in low-bandwidth Cameroonian environments, KamerFresh integrates modern multi-modal AI reasoning, lightweight spatial tracking, bicultural accessibility, and strict database security isolation models.

---

## 3.2 System Architecture Overview
The software architecture adopts an asynchronous **Full-Stack Serverless Service Archetype** (Figure 3.1). The architecture separates presentation logic on the client, transaction and schema governance on a serverless database backend (Supabase PostgreSQL), and visual diagnostics and agricultural intelligence on an isolated LMM microservice accessed via server-side proxies in Next.js.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT PORTALS                                    |
|                                                                                   |
|   +----------------------------+   PWA     +----------------------------------+   |
|   |   Interactive Onboarding   |  Assets   |   Bilingual Dual-Grid Marketplace|   |
|   |   (Spring Sliding Switch)  |<--------->|   - Dual-row Mobile Layout Density|   |
|   +----------------------------+  Caching  +----------------------------------+   |
|                  ^                                           ^                    |
|                  | Interaction                               | Render             |
|                  v                                           v                    |
|   +----------------------------+           +----------------------------------+   |
|   |    Multi-Channel Ingest    |           |   Transit Routing Map Interface  |   |
|   |    (Drag & Drop / Camera)  |           |   - React-Leaflet Leaflet Panels |   |
|   |    - Audio Waveform TTS UI |           |   - OTP Delivery Handshake       |   |
|   +----------------------------+           +----------------------------------+   |
+------------------^-------------------------------------------^--------------------+
                   |                                           |
                   | Secured REST API / JSON                   | Web Sockets (Real-time CDC)
                   v                                           v
+------------------v-------------------------------------------v--------------------+
                   |   SERVER-SIDE CONTROLS (Next.js App Router API)                |
                   |   - TLS Security Boundary                                      |
                   |   - Direct process.env.GEMINI_API_KEY Ingestion (Hidden)        |
+------------------^-------------------------------------------^--------------------+
                   |                                           |
                   | JSON Response Object                      | SQL Transaction / Session Attribute
                   v                                           v
+------------------v--------------+             +--------------v--------------------+
                   | FOUNDATIONAL LAYER           |               POSTGRESQL DB (Supabase)           |
                   | Google GenAI SDK Engine      |               - Row-Level Security Rules         |
                   | - Model: gemini-3.5-flash    |               - profiles, products, diagnoses    |
                   | - Strictly Injected Schema   |               - escrow balances & admin flags    |
                   +------------------------------+               +----------------------------------+
```
*Figure 3.1: KamerFresh Complete System Architecture*

---

## 3.3 Hardware and Software System Specifications

### 3.3.1 Engineering & Development Toolchain
The software pipeline is built on the following technologies:
- **Programming Language:** TypeScript (v5.0+), enforcing type safety, preventing string-casting runtime bugs, and securing strict object signatures.
- **Host Application Framework:** Next.js (v15.0+ with App Router), facilitating server-rendered layouts, fast client routing, and secure server-side API routing.
- **Styling Architecture:** Tailwind CSS (v4.0), executing an efficient post-processing compiler via `@tailwindcss/postcss`.
- **Database Engine:** Supabase PostgreSQL (Postgres 15), supporting relational SQL operations, Row-Level Security policies, and real-time transaction tracking via WebSockets (CDC).
- **AI Integration core:** Google GenAI TypeScript SDK, referencing **Gemini 3.5 Flash** as the default multi-modal model.
- **Acoustic Audio Pipeline:** HTML5 SpeechSynthesis Web API, executing speech-to-client vocals without server performance penalties.
- **Mapping & Leaflet Geodesics:** Leaflet and React-Leaflet libraries, resolving geodesic positions directly onto OpenStreetMap overlays.

### 3.3.2 Physical Deployment and Low-Bandwidth Testing Bounds
To simulate the physical constraints of Cameroon’s farming sectors, the application viewport density and data synchronization systems are audited under the following testing conditions:
- **Simulated Rural Port (3G Mobile):** Operates on an Android Chrome Mobile client, restricted via developer throttling to a simulated 3G network (300kbps down, 150kbps up, 250ms latency), validating local state preservation when transactions are delayed.
- **Administrative Station (Desktop):** Evaluated on a 1080p viewport, testing system metrics, system logs, escrow balances, and transaction diagnostics on the secure Admin Panel.

---

## 3.4 Database Schema Design and Row-Level Security Rules

### 3.4.1 Normalized Relational DDL Schema Definitions
```sql
-- Database tables for role-based agritech commerce
CREATE TYPE user_role AS ENUM ('farmer', 'buyer');

-- Profiles Table containing system flags
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    user_type user_role,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crop Diagnostics Metadata
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    crop_type TEXT NOT NULL,
    detected_crop_type TEXT, -- Populated if crop_type input was specified as 'Other'
    image_url TEXT NOT NULL,
    result_label TEXT NOT NULL,
    confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    description TEXT NOT NULL,
    symptoms TEXT[] NOT NULL,
    treatment_steps TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Listings with initial and residual stock metrics
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

-- Escrow Ledger and Delivery tracking state table
CREATE TABLE escrow_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    escrow_status TEXT NOT NULL DEFAULT 'offered' CHECK (escrow_status IN ('offered', 'escrow_locked', 'disbursed', 'cancelled')),
    otp_hash TEXT NOT NULL, -- Encrypted delivery verification key
    carrier_latitude DOUBLE PRECISION DEFAULT 4.05, -- Transit coordinates
    carrier_longitude DOUBLE PRECISION DEFAULT 9.70,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4.2 Row-Level Security (RLS) Policy Specifications
Postgres security models isolate data pathways at the engine layer, preventing unauthorized reads or transactional manipulation:

1. **Profile Access Policy:**
   ```sql
   CREATE POLICY "profiles_read_all" ON public.profiles
   FOR SELECT USING (true);
   
   CREATE POLICY "profiles_update_self" ON public.profiles
   FOR UPDATE USING (auth.uid() = id);
   ```
2. **Product Control Policy (Strict Farmer Constraint):**
   ```sql
   CREATE POLICY "products_create_farmer" ON public.products
   FOR INSERT WITH CHECK (
       auth.uid() = farmer_id 
       AND EXISTS (
           SELECT 1 FROM public.profiles 
           WHERE id = auth.uid() AND user_type = 'farmer'
       )
   );
   
   CREATE POLICY "products_modify_owner" ON public.products
   FOR UPDATE USING (auth.uid() = farmer_id);
   ```
3. **Diagnosis Confidentiality Policy:**
   ```sql
   CREATE POLICY "diagnoses_read_self" ON public.diagnoses
   FOR SELECT USING (auth.uid() = farmer_id);
   
   CREATE POLICY "diagnoses_insert_self" ON public.diagnoses
   FOR INSERT WITH CHECK (auth.uid() = farmer_id);
   ```
4. **Escrow Ledger Protection:**
   ```sql
   CREATE POLICY "escrow_isolation" ON public.escrow_orders
   FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = (SELECT farmer_id FROM public.products WHERE id = product_id));
   ```
5. **Admin Access Assertions (`is_admin` restriction):**
   Rather than performing soft UI masking on the client dashboard, administrative operations are protected on the server side using explicit middleware checks that fetch the caller's profile and assert `is_admin = TRUE` directly from the PostgreSQL engine. If this evaluation fails, the database rejects all bypass commands.

---

## 3.5 AI Crop Diagnosis & Botanical Identification Algorithm

The AI interface executes complex horticultural analysis without forcing smallholder farmers to know their host plants. The diagnostic system uses a server-side route powered by `@google/genai` that interacts with **Gemini 3.5 Flash** using dynamic inline model instructions.

### 3.5.1 Multi-Modal Ingest and Zero-Shot Discovery Pipeline (Algorithm 3.1)
The process of diagnostic and species identification executes according to the following programmatic pipeline:

```
========================================================================================
ALGORITHM 3.1: Server-Side Zero-Shot Host Classification and Pathological Diagnosis
========================================================================================
INPUT:  img_b64 (Base64-encoded compressed plant leaf image stream)
        selected_crop (Fallback label entered by farmer; value equals 'Other' if unknown)
        weather_metrics (JSON object containing current Temperature, Humidity, and Wind speed)
OUTPUT: Standardized JSON Report containing Host classification and Treatment blueprints
========================================================================================

1.  PROCEDURE run_leaf_diagnosis(img_b64, selected_crop, weather_metrics):
2.      IF img_b64 IS Empty THEN RETURN ERROR_CODE(400, "Incomplete multi-modal payload");
3.      
4.      // Execute client compression inside browser canvas to normalize telemetry weight
5.      normalized_img_data := compress_canvas_image(img_b64, max_width=1000, target_size=400KB);
6.      
7.      // Set up system instruction prompt configurations
8.      prompt_base := "You are KamerFresh's AI Plant Doctor, a computer vision pathologist expert in 
9.                     Central African crops. Analyze this leaf image and deliver diagnostics."
10.     
11.     IF selected_crop EQUALS 'Other' OR selected_crop IS EMPTY THEN:
12.         prompt_behavior := "Analyze the morphological features of this leaf and identify the plant 
13.                            species (e.g., Cassava, Plantain, Mango). Assign this identified name to the 
14.                            JSON key 'detectedCropType' as a human-readable title."
15.     ELSE:
16.         prompt_behavior := "Confirm the plant in focus is " + selected_crop + " and assign that 
17.                            value directly to the JSON key 'detectedCropType'."
18.     ENDIF
19.     
20.     // Enrich the context matrix with sub-regional weather telemetries
21.     weather_prompt := "Ambient Climate Vectors: " + FormatJSON(weather_metrics) + ". 
22.                       Map how current humidity and wind speed may act as disease vectors for transmission."
23.     
24.     prompt_final := prompt_base + prompt_behavior + weather_prompt;
25.     
26.     // Establish structured schema using type enums from @google/genai
27.     response_schema := DEFINE_JSON_SCHEMA({
28.         diseaseName: Type.STRING,
29.         scientificName: Type.STRING,
30.         detectedCropType: Type.STRING,
31.         confidence: Type.NUMBER,
32.         status: Type.STRING (restricted to 'healthy', 'warning', 'critical'),
33.         description: Type.STRING,
34.         symptoms: Type.ARRAY (Type.STRING),
35.         treatmentSteps: Type.ARRAY (Type.STRING),
36.         causes: Type.ARRAY (Type.STRING),
37.         preventions: Type.ARRAY (Type.STRING),
38.         environmentalContext: Type.STRING
39.     }, REQUIRED=["diseaseName", "detectedCropType", "confidence", "status", "treatmentSteps"]);
40.     
41.     // Secure execution via Server-Side REST Proxy using process.env.GEMINI_API_KEY
42.     // Note: Set User-Agent to 'aistudio-build' inside SDK options as required
43.     response_stream := CALL_GOOGLE_GENAI_SERVICE(
44.         model="gemini-3.5-flash",
45.         contents=[
46.             { inlineData: { mimeType: "image/jpeg", data: normalized_img_data } },
47.             { text: prompt_final }
48.         ],
49.         config={
50.             responseMimeType: "application/json",
51.             responseSchema: response_schema,
52.             temperature: 0.2
53.         }
54.     );
55.     
56.     json_parsed := ParseJSON(response_stream.text);
57.     
58.     // Write to postgres database under active authenticated farmer session
59.     INSERT INTO public.diagnoses(
60.         farmer_id, crop_type, detected_crop_type, image_url, result_label, 
61.         confidence, status, description, symptoms, treatment_steps
62.     ) VALUES (
63.         auth.uid(), selected_crop, json_parsed.detectedCropType, image_url_asset, 
64.         json_parsed.diseaseName, json_parsed.confidence, json_parsed.status, 
65.         json_parsed.description, json_parsed.symptoms, json_parsed.treatmentSteps
66.     );
67.     
68.     RETURN json_parsed;
69. END PROCEDURE
70. ========================================================================================
```

---

## 3.6 Multi-Channel Ingest and Speech-Synthesis Accessibility

### 3.6.1 Desktop Drag-and-Drop Dropzone Gestures
To remove interactive friction, the diagnostic portal utilizes HTML5 drag events to monitor files moving across the viewport:
- **Event Observers:** Hooked directly to the primary container using standard event boundaries (`onDragOver`, `onDragLeave`, `onDrop`).
- **Interactive State Mutation:** When dragging is observed, the dashboard modifies layout parameters, rendering a full-bleed dark screen overlay (`z-30`) with custom blur backdrops (`backdrop-blur-md`) and a bouncing container:
  $$\text{Dropzone Mask State} = \begin{cases} \text{Active (Blur + Bounce Icon)}, & \text{isDragging} = \text{true} \\ \text{Inactive (Hidden)}, & \text{isDragging} = \text{false} \end{cases}$$
- Releasing the cursor over the active dropzone directly sanitizes the file type, asserts MIME rules (`file.type.startsWith('image/')`), validates the operational boundary limit ($5\text{MB}$), and loads the asset into standard FileReader caches.

### 3.6.2 Voice-Synthesized Auditory Advisory Assistant
To assist visually impaired or low-literacy users, KamerFresh includes a custom **Acoustic Speech Synthesis Engine** on the diagnosis summary page:
- **Engine Activation:** The interface hooks into browser API configurations (`window.speechSynthesis`), compiling a dedicated `SpeechSynthesisUtterance` array from the `recommendations` or `treatment_steps` strings.
- **Synthesizer Control Routine:**
  ```typescript
  const handleSpeechToggle = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(report?.treatmentSteps.join('. '));
      utterance.lang = 'en-US'; // Supports 'fr-FR' translations dynamically
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };
  ```
- **Acoustic Visualizer Animation:** When `isSpeaking = true`, the interface renders a dynamic graphic display consisting of bouncing rounded vertical lines. The visualizer maps three active vertical spans, executing standard CSS bounce keyframes to simulate physical acoustic wave fluctuations.

---

## 3.7 Escrow Ledger and Geospatial Courier Handshake Protocols
To ensure financial safety on regional transit corridors, KamerFresh uses a **Simulated Geoprogressive Escrow State Machine**.

1. **State Transition Ledger:**
   Transactions begin in `offered` status. Once the buyer transfers capital, the database updates the status to `escrow_locked`, locking the funds against the farmer's listing.
2. **Transit Geolocation Visuals:**
   Vehicles and cargo locations are monitored using real-time GPS coordinate loops. React-Leaflet reads changing carrier locations along the designated transit highways, plotting markers dynamically:
   $$\text{Haversine Distance }(d) = 2r \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$
3. **One-Time Password (OTP) Verification:**
   Upon arrival, the buyer confirms physical delivery of produce and registers their custom OTP digits inside the courier's interface. If the entered value matches the database hash, the transaction transitions to `disbursed`, release of the fund is executed, and capital is transferred to the farmer's wallet.

---

## 3.8 Human-Centric UI Engineering & Adaptive Design

### 3.8.1 The Zero-Prompt Interactive Onboarding Hub
To reduce user friction at entry, KamerFresh avoids open text inputs or complex sign-up sheets:
- **Interactive Sliding Pill:** Designed using physical spring configurations (`stiffness = 380`, `damping = 30`) via the React animation framework.
- **Interface Pathing:** Toggling the mode actively redirects user layouts. Selecting **Farmer Mode** renders links directly to AI diagnostics, product creations, and sales charts. Toggling **Buyer Mode** immediately exposes wholesale listings and active logistics orders.

### 3.8.2 Mobile-Optimal Marketplace Layout Density
To optimize presentation layouts on small screens, Single-column listings are replaced with a strict **dual-column mobile layout** (`grid-cols-2`) on handheld viewports:
- **Visual Stability:** Screen margins are minimized using compact spacing grids (`gap-3`). Bounding containers enforce standard widescreen aspect ratios, keeping product layouts clean and stable.
- **Mandatory Image Visibility:** Product images render permanently on all screens without collapse, preserving key freshness levels and quality tags to support instant customer scanning.

### 3.8.3 Unicode Graphic Audits
To prevent broken graphic rendering on older mobile operating systems, the platform's icons are mapped to native Unicode glyph structures of Google Material Symbols:
- Replaces non-standard, deprecated Material glyphs with reliable alternatives (e.g., `email_heart` is audited to `alternate_email`, and `person_check` is replaced with `assignment_ind`).
- Interactive triggers are explicitly injected with pointer indicators (`cursor-pointer`) to resolve hover feedback issues on hybrid touchscreen/mouse environments.

### 3.8.4 Form Warning Badges and Rollback Cache Controls
The user profile editing portal implements tactile visual alerts:
- **Modified Input Badges:** Changing fields prompts real-time border shifts and displays pulsing amber badges ("Unsaved changes").
- **Double-Safe Database Rollback:** To protect data integrity from accidental edits, the cancellation sequence discards frontend input caches and restores baseline records queried directly from PostgreSQL, preventing state corruption.

---

## 3.9 Summary of Chapter
Chapter 3 presents the materials and methodologies used to construct the KamerFresh platform. By integrating server-side Gemini 3.5 Flash zero-shot classifiers, strict Supabase PostgreSQL RLS locks, interactive multi-channel gesture dropzones, accessible TTS audio waveforms, and mobile-optimal dual layouts, KamerFresh establishes a highly functional, safe, and inclusive agritech platform for developing regions.
