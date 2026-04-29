# CHAPTER 1: INTRODUCTION

## 1.1 Background of the Study
Agriculture remains the fundamental pillar of Cameroon’s economy, employing over 60% of the active workforce and contributing significantly to the Gross Domestic Product (GDP). For the majority of smallholder farmers in regions like the Northwest and West, farming is not merely an occupation but a primary means of survival. However, the sector is currently facing a "technological stagnation" where traditional practices are no longer sufficient to combat the evolving threats of climate change, emerging crop diseases, and volatile market dynamics.

The global shift towards **Agriculture 4.0**—characterized by the integration of Artificial Intelligence (AI), Internet of Things (IoT), and Big Data—offers a transformative path. In Cameroon, while mobile penetration is high, the adoption of "Smart Agri-Tech" tools remains low due to a lack of integrated platforms that cater to the specific local needs of a farmer: from the health of the seed to the final sale of the harvest. This research explores the design of a unified digital ecosystem that bridges these gaps using modern web technologies and Machine Learning.

## 1.2 Description of the Research Problem
Smallholder farmers in Cameroon are currently plagued by a "triad of inefficiency" that threatens food security and rural livelihoods:

1. **Diagnostic Delay:** Most farmers rely on visual, anecdotal evidence to identify crop diseases. By the time a disease is identified, it is often too late, leading to total crop failure or the excessive, expensive use of incorrect pesticides.
2. **Expert Scarcity:** There is a critical shortage of agricultural extension officers. A single officer is often responsible for thousands of farmers across vast, poorly road-connected terrains, making timely digital advisory a necessity rather than a luxury.
3. **Market Asymmetry:** Farmers often lack direct access to urban markets. They are forced to sell to "buyam-sellams" (middlemen) at significantly reduced prices because they lack a platform to showcase their produce to a wider, verified buyer base or track the movement of their goods.

## 1.3 Research Questions and Objectives

### 1.3.1 Research Questions
- How can Machine Learning models be effectively integrated into a web interface to provide instant, high-accuracy crop diagnosis for local Cameroonian staples?
- To what extent can a simulated digital marketplace reduce the price gap between farm-gate prices and urban market rates?
- What architectural design is required to ensure an integrated Agri-Tech platform remains functional in low-connectivity rural environments?

### 1.3.2 Research Objectives
* **General Objective:** To design and implement an integrated web application that leverages Machine Learning and real-time data to connect crop diagnosis, expert advisory, and market linkages for Cameroonian smallholder farmers.
* **Specific Objectives:**
    1. To develop a computer vision module using the **Gemini 1.5 Flash API** capable of classifying common leaf diseases (e.g., Tomato Late Blight, Corn Rust).
    2. To implement a real-time **Logistics Tracking module** using Leaflet.js to monitor produce transit from rural farms to urban hubs.
    3. To build a secure, **Direct-to-Consumer (D2C) Marketplace** allowing farmers to list produce and Buyers to place orders using a unified dashboard.
    4. To evaluate the system’s usability and performance through simulated stress tests and user-interface audits.

## 1.4 Rationale of the Study
This study is motivated by the urgent need to digitize the agricultural value chain in Cameroon. By providing a "one-stop-shop" for farmers, the project reduces the cognitive load of managing multiple disjointed tools.
- **For the Farmer:** It provides a safety net against crop loss and ensures fair pricing.
- **For the Economy:** It aligns with the **National Development Strategy (SND30)**, which prioritizes the digital transformation of the agricultural sector to achieve food sovereignty.
- **Technical Rationale:** It demonstrates the practical application of AI and real-time databases (Supabase) in solving local socio-economic problems.

## 1.5 Scope and Limitation of the Study

### 1.5.1 Scope
The study focuses on the design and implementation of a **Progressive Web Application (PWA)**. Geographically, the simulated data and mapping components center on the **Northwest (Bamenda)** and **Littoral (Douala)** regions, representing a typical rural-to-urban supply chain. The ML component is scoped to 10 common crop types prevalent in these regions.

### 1.5.2 Limitations
1. **Connectivity:** The application requires an internet connection for AI diagnosis, although some marketplace features are cached for offline viewing.
2. **Hardware:** The accuracy of the ML diagnosis is dependent on the camera quality of the farmer's mobile device.
3. **Language:** While the app is bilingual (English/French), it does not yet support local "Pidgin" or indigenous languages, which may be a barrier for some elderly farmers.
