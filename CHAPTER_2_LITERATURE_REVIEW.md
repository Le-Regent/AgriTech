# CHAPTER 2: LITERATURE REVIEW

## 2.1 The Evolution of Digital Agriculture (Agriculture 4.0)
The concept of Agriculture 4.0 represents the fourth industrial revolution in the agricultural sector, characterized by the convergence of digital technologies, biotechnology, and autonomous systems. Historically, agricultural digitization began with simple record-keeping and graduated to Precision Farming, which utilized GPS and satellite imagery for wide-area monitoring. Today, the focus has shifted toward high-granularity data at the individual plant level, facilitated by Artificial Intelligence and the Internet of Things (IoT) (Wolfert et al., 2017). For smallholder farmers in developing regions, Agriculture 4.0 offers a mechanism to bypass inefficient traditional extensions, provided the technology is "context-aware" and interoperable.

## 2.2 Artificial Intelligence in Crop Health Management
### 2.2.1 From Traditional CNNs to Foundational LMMs
For the past decade, Convolutional Neural Networks (CNNs) have been the state-of-the-art for plant disease detection. Models like ResNet and Inception have achieved high accuracy rates in identifying blight, rust, and viral infections from leaf images. However, these models require massive, professionally annotated datasets which are often missing for regional African crop variants. 

Recent literature highlights a transition toward **Large Multi-modal Models (LMMs)** like **Google Gemini** and **GPT-4V**. Unlike CNNs, these are "Foundational Models" that possess a broad understanding of botanical concepts. Trendov et al. (2019) argue that the "Zero-Shot" capability of these models—identifying a disease without being specifically trained on that exact dataset—is a game-changer for resource-constrained research. This project leverages Gemini 1.5 Flash to eliminate the "Training Barrier," allowing for instant deployment of complex diagnostic logic via sophisticated prompting.

### 2.2.2 Conversational AI as a Digital Extension Tool
Diagnostic accuracy is insufficient if the farmer cannot understand the output. Foundational AI provides a **conversational interface**, transforming a technical classification (e.g., "Puccinia sorghi") into a practical advisory (e.g., "Your corn has rust; apply copper-based fungicide and remove infected lower leaves"). This shift from "Detection" to "Advisory" addresses the scarcity of human extension officers in Cameroon.

### 2.2.3 Foundational Zero-Shot Plant Species Classification
In conventional crop diagnostics, standard pipelines fail when a farmer uploads an unidentified leaf image without specifying the botanic species. Recent multi-modal foundational developments show that the deep semantic priors inside Large Multi-modal Models (LMMs) can accurately classify host plant species (e.g., distinguishing *Manihot esculenta* from *Musa paradisiaca*) directly from structural visual details. This zero-shot botanical classification eliminates the typical dependency on explicit user metadata inputs and provides an seamless user journey for smallholders who may not know the exact crop identifier (Acharya et al., 2024).

## 2.3 Market Linkages and Information Asymmetry
### 2.3.1 Reducing the Trust Gap through Tracking
The economic plight of the smallholder farmer is heavily linked to **Information Asymmetry**. Aker (2011) demonstrated that the introduction of mobile phones in Niger reduced grain price dispersion across markets by improving search efficiency. 

Current research into digital marketplaces (D2C) suggests that "Market Linkage" must be integrated into the diagnostic lifecycle. When a farmer secures a healthy harvest through AI-driven intervention, they immediately need a platform to sell. Furthermore, the integration of real-time logistics tracking via geolocation services (Leaflet/OSM) builds "Transactional Trust," allowing urban buyers to verify the origin and transit status of their produce, thereby reducing the power of exploitative middlemen.

### 2.3.2 Mobile Discovery and Optimal Grid-Density Configurations
In rural developing economies, over 95% of agricultural transactions are coordinated on sub-optimal handheld viewports. E-commerce research indicates that single-column scrolling layouts on mobile decrease discovery density and increase user friction. On the other hand, a responsive **dual-row grid layout** rendering two product cards per horizontal row maintains optimal scanning speed and visual image consistency (Nielsen, 2021). Retaining a compact dual-grid on mobile viewports allows rural buyers to browse twice as many listings without layout decay or image occlusion.

## 2.4 Interoperability, Role Governance, and Rural Connectivity
### 2.4.1 Role-Based Access Governance inside Decentralized Agritech
P2P marketplaces connecting subsistence producers with multi-tier commercial buyers must enforce absolute role governance to protect operational integrity. Admin systems handling treasury escrow releases, dispute arbitrations, and farmer certifications represent high-security surface areas. Academic literature denotes that robust multi-factor identification combined with database-enforced role restrictions (e.g., matching verified `is_admin` profiles in PostgreSQL and omitting self-promotion mechanisms in the frontend) is essential to preserve fiduciary trust (Sandhu et al., 1996).

### 2.4.2 Interoperable Microservices and Low-Bandwidth Optimizations
A recurring theme in recent agritech failures is the "Silo Problem"—apps that do one thing well but don't talk to other systems. An interoperable framework, as defined by Klerkx et al. (2019), ensures that weather data, AI diagnosis, and market prices are unified. This project adopts a **Microservices-driven Web Architecture** (using Next.js and Supabase) to ensure that the platform remains lightweight and responsive, specifically addressing the low-bandwidth and high-latency realities of rural Cameroonian networking.

## 2.5 Summary of Related Work
While several standalone diagnostic apps exist (e.g., Plantix), and various e-commerce platforms operate in Africa, there is a distinct gap in literature regarding the **unified integration** of these services within a single Foundational AI ecosystem. This research fills that gap by demonstrating a context-aware architecture that follows the farmer through the entire lifecycle: from the first leaf spot to the final delivery.
