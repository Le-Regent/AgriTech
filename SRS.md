# Software Requirements Specification (SRS) - KamerFresh

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive description of the KamerFresh platform. It outlines the functional and non-functional requirements for the peer-to-peer agricultural marketplace, designed to connect farmers directly with buyers while ensuring produce quality and reliable logistics.

### 1.2 Scope
KamerFresh is a full-stack web application that facilitates the trade of agricultural products. It includes features for product listing, AI-powered quality assessment (Crop Diagnosis), inventory management with freshness tracking, secure escrow payments, and real-time delivery tracking.

### 1.3 Intended Audience
- Developers and contributors to the project.
- Stakeholders (Farmers, Logistics Providers, Platform Administrators).
- Investors and Partners in the agricultural tech space.

---

## 2. Overall Description

### 2.1 User Classes and Characteristics
- **Farmers (Sellers):** Users who list their produce, manage inventory, use AI tools for crop health, and fulfill orders.
- **Buyers (Consumers/Wholesalers):** Users who search for fresh produce, make purchases, and track deliveries.
- **Platform Administrators:** Internal staff responsible for user verification, resolving disputes, and overseeing platform financial health.

### 2.2 System Perspective
The application is built using Next.js for the frontend and Supabase for backend services (Authentication, Database, Storage, and Real-time data). External integrations include the Google Gemini API for AI-based diagnoses and Campay for mobile money transactions.

---

## 3. System Features

### 3.1 User Authentication & Profile Management
- **Registration/Login:** Secure signup for Farmers and Buyers using Supabase Auth.
- **Verification:** Verification status for farmers based on history or certification.
- **Role-Based Workflows:** Distinct dashboards for farmers and buyers.

### 3.2 Marketplace & Inventory
- **Product Listings:** Farmers can list products with images, price, quantity, and category.
- **Freshness Level Tracking:** Real-time visual indicators for perishable goods based on harvest and expiry dates.
- **Smart Filtering:** Search by category, price, location, and freshness status.

### 3.3 AI-Powered Crop Diagnosis
- **Image Analysis:** Farmers can upload images of crops for disease detection and health assessment using Gemini AI.
- **Actionable Insights:** AI provides recommendations for treatment and maintenance.

### 3.4 Order & Escrow Fulfillment
- **Secure Checkout:** Buyers pay via mobile money (Campay); funds are held in escrow.
- **Real-Time Tracking:** Multi-step status updates (Pending -> Escrow -> Processing -> Shipped -> Handshake -> Done).
- **Handshake Protocol:** OTP-based verification at delivery to ensure buyer satisfaction before releasing funds to the farmer.
- **Digital Waybill:** Farmers upload shipment evidence (images) for transparency and trust.

### 3.5 Analytics & Waste Management
- **Waste Logs:** Farmers can log spoiled produce to analyze loss patterns.
- **Sales Insights:** Visual analytics for farmers to track performance over time.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- **Responsive Web Design:** Accessible via desktop, tablet, and mobile browsers.
- **Theming:** Support for Dark and Light modes.

### 4.2 Software Interfaces
- **Supabase:** Database, Storage, and Authentication.
- **Google Gemini API:** AI model processing.
- **Campay API:** Mobile money payment processing.
- **Leaflet/MapBox:** Geospatial data for logistics and farmer location.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Sub-second latency for marketplace browsing.
- Real-time updates for sensor data and notifications.

### 5.2 Security
- Row-Level Security (RLS) in Supabase to protect user data.
- Escrow mechanism to protect financial transactions.
- Encrypted storage for sensitive evidence and user documents.

### 5.3 Reliability
- Automatic data persistence ensuring no loss of order history or diagnosis results.

---

## 6. Data Requirements

### 6.1 Data Models
- **Profiles:** User metadata, roles, and verification status.
- **Products:** Listing details, stock levels, and freshness timestamps.
- **Orders:** Transactional records, logistics status, and evidence URLs.
- **Diagnoses:** History of AI-powered crop assessments.
- **Notifications:** Real-time alerts for system events (low stock, order updates).
