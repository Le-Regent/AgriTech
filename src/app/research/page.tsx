'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useLanguage } from '@/context/LanguageContext';

const CHAPTER_1 = `
# CHAPTER 1: INTRODUCTION

## 1.1 Background of the Study
Agriculture serves as the fundamental lifeblood of economic development in Cameroon, employing over 60% of the active population. Despite its importance, for many smallholder farmers, farming remains a high-risk venture. Traditional practices are increasingly insufficient in the face of rapid climate shifts and emerging pathogenic threats.

In the era of **Agriculture 4.0**, this research breaks from the tradition of training specialized models by leveraging **Large Multi-modal Models (LMMs)**, specifically **Google’s Gemini 1.5 Flash**. By adopting a "Foundational AI" approach, we eliminate the need for local model training, instead utilizing Gemini's sophisticated vision-to-text reasoning capabilities to provide zero-shot diagnosis and conversational advisory that adapts to the farmer's unique context in real-time.

## 1.2 Description of the Research Problem
The agricultural value chain in Cameroon is currently hindered by a "Triple Constraint":

1.  **The Professional Advisory Gap:** Farmers lack immediate access to pathologists. While previous paradigms relied on static CNNs, they lacked the "reasoning" capability to provide tailored management plans.
2.  **Environmental Data Fragmentation:** Meteorological data is generalized. Lack of localized visualization tools prevents farmers from correlating weather patterns with crop health.
3.  **Market Opacity:** Information asymmetry gives middlemen an unfair advantage. Post-harvest losses (estimated at 30-40%) are exacerbated by a lack of visibility into the produce shipment lifecycle.

## 1.3 Research Questions and Objectives

### 1.3.1 Research Questions
- **Q1:** How can **Gemini AI Vision APIs** be integrated into a mobile-first web architecture to provide expert-grade, zero-shot crop diagnosis for local staples?
- **Q2:** To what extent does a "Context-Aware" dashboard (merging AI insights with real-time weather) improve the speed of farmer intervention?
- **Q3:** How does the implementation of a transparent, live-tracking marketplace reduce the "Trust Gap" between rural producers and urban buyers?

### 1.3.2 Research Objectives
**Primary Objective:**
To design, develop, and evaluate an interoperable, context-aware web application that integrates Gemini-powered AI diagnosis, localized environmental dashboarding, and a transparent logistics-enabled marketplace.

**Specific Objectives:**
1.  **Implement Multi-modal Inference:** Leverage Gemini 1.5 Flash to create a "Plant Doctor" module for image analysis and treatment planning.
2.  **Architect Environmental Intelligence:** Build a real-time dashboard providing sub-regional weather visualizations for agricultural decision-making.
3.  **Develop Logistical Transparency:** Integrate **Leaflet and OpenStreetMap** to provide live GPS-simulated tracking for produce shipments.
4.  **Facilitate Direct Market Linkage:** Construct a secure marketplace for direct, verified buyer-seller interactions.

## 1.4 Work Done So Far (System Features)
-   **AI Health Center:** Integrated Gemini API for zero-shot leaf analysis and conversational treatment plan generation.
-   **Live Logistics Hub:** Real-time map interface visualizing produce movement between Bamenda and Douala with status alerts.
-   **Contextual Weather Dashboard:** Real-time meteorological metrics dashboard emphasizing planting risk and harvest opportunities.
-   **Integrated Marketplace:** Secure D2C portal enabling product listing, direct ordering, and market insight tracking.
-   **Bilingual Framework:** Full support for English and French to ensure maximum inclusivity for the Cameroonian landscape.
`;

const CHAPTER_2 = `
# CHAPTER 2: LITERATURE REVIEW

## 2.1 The Evolution of Digital Agriculture (Agriculture 4.0)
The convergence of digital technologies, biotechnology, and autonomous systems has birthed **Agriculture 4.0**. Historical digitization began with simple record-keeping but has now graduated to Precision Farming. For smallholder farmers in developing regions, this offers a mechanism to bypass inefficient traditional extensions.

## 2.2 Artificial Intelligence in Crop Health Management
### 2.2.1 From Traditional CNNs to Foundational LMMs
For the past decade, CNNs were state-of-the-art. However, they require massive datasets often missing for regional African crop variants. This research leverages **Large Multi-modal Models (LMMs)** like **Google Gemini**, possessing a "Zero-Shot" capability to identify diseases without being specifically trained on those datasets.

### 2.2.2 Conversational AI as a Digital Extension Tool
Diagnostic accuracy is insufficient if output is not understandable. Foundational AI provides a **conversational interface**, transforming technical classifications into practical advisory, addressing the scarcity of extension officers in Cameroon.

## 2.3 Market Linkages and Information Asymmetry
The plight of smallholders is linked to **Information Asymmetry**. Introduction of mobile marketplaces reduces grain price dispersion. Real-time logistics tracking via geolocation builds "Transactional Trust," allowing buyers to verify the transit status and origin of produce.

## 2.4 Summary of Related Work
While standalone apps exist, there is a gap in the **unified integration** of these services within a single Foundational AI ecosystem. This research demonstrates a context-aware architecture following the farmer through the entire harvest-to-market lifecycle.
`;

const PRELIMINARY = `
# PRELIMINARY SECTION

### TITLE PAGE
**THE UNIVERSITY OF BAMENDA**  
**COLLEGE OF TECHNOLOGY**  
**DEPARTMENT OF COMPUTER ENGINEERING**

**TITLE: INTEGRATED CONTEXT-AWARE WEB SYSTEM FOR SUSTAINABLE AGRITECH: LEVERAGING GEMINI AI FOR SMALLHOLDER FARMER RESILIENCE**

**A Dissertation Submitted to the Department of Computer Engineering in the College of Technology of the University of Bamenda in Partial Fulfillment of the Requirements for the Award of a Bachelor of Science (B.Sc.) Degree in Computer Engineering**

**BY:**  
**NOMBIE KENNE STERONE**  
**REGISTRATION NUMBER: UBA23PB040**

**SUPERVISOR:**  
**DR. FORBATCHA (Lecturer)**

**APRIL 2026**
`;

export default function ResearchPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'preliminary' | 'chapter1' | 'chapter2'>('preliminary');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white uppercase">Research Documentation</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Uba Coltech Thesis Framework
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-100 dark:border-border-dark shadow-sm overflow-hidden min-h-[600px]">
        <div className="flex bg-slate-50 dark:bg-slate-800/50 p-2 border-b border-slate-100 dark:border-border-dark gap-2">
          <button 
            onClick={() => setActiveTab('preliminary')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'preliminary' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:bg-white'
            }`}
          >
            Preliminary Pages
          </button>
          <button 
            onClick={() => setActiveTab('chapter1')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'chapter1' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:bg-white'
            }`}
          >
            Chapter 1: Introduction
          </button>
          <button 
            onClick={() => setActiveTab('chapter2')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'chapter2' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:bg-white'
            }`}
          >
            Chapter 2: Literature
          </button>
        </div>

        <div className="p-8 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="markdown-body dark:prose-invert"
            >
              <div className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-p:text-slate-600 dark:prose-p:text-slate-400">
                <Markdown>
                  {activeTab === 'preliminary' ? PRELIMINARY : activeTab === 'chapter1' ? CHAPTER_1 : CHAPTER_2}
                </Markdown>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
