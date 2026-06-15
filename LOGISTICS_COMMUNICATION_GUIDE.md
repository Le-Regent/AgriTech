# Logistics Communication Guide

This document explains the technical architecture and workflow of the Logistics module and the **In-App Messaging** system implemented in the **Agri-Tech Platform**.

## 1. Overview

The Logistics system ensures transparency between farmers and buyers. Instead of external dependencies like SMS, we leverage the platform's native **Internal Communication** system to provide real-time updates.

## 2. Technical Architecture

### Logistics Dashboard (`/logistics`)
- **Real-time Synchronization**: Uses a hybrid SWR-style caching strategy. It loads instantaneous data from the local cache (`useOffline`) and revalidates with Supabase in the background.
- **Supply Chain Visualization**: An interactive timeline that maps the current `status` of an order to a visual progress bar.

### Internal Communication System
Communication is handled through two channels simultaneously:

1. **In-App Notifications**:
   - Triggers when an order status changes (Processing, Shipped, Delivered).
   - Appear in the user's notification center with a direct link to the order details.
2. **Direct Messaging**:
   - An automated chat message is sent from the Seller (Farmer) to the Buyer.
   - This keeps the logistics conversation within the existing "Messages" section, allowing for easy follow-up questions from the buyer.

## 3. Workflow Implementation

The communication flow is integrated into `supabaseService.ts` within the `updateOrderStatus` method:

1. **Status Update**: The system detects a change in the `status` field.
2. **Context Retrieval**: It identifies the associated products and the farmer responsible for the shipment.
3. **Dispatch**: 
   - A `Notification` object is created and inserted into the database.
   - A `Message` object is generated, appearing as an automated "Logistics Update" in the user's chat history.

## 4. Key Advantages
- **Single Source of Truth**: All communication—from negotiation to delivery tracking—lives in the same chat thread.
- **High Privacy**: No phone numbers are shared or exposed to external providers.
- **Zero Cost**: No SMS credits or external API fees are required.
- **Seamless Experience**: Users don't have to leave the app to stay informed.

## 5. Benefits
- **Reduced Anxiety**: Buyers are informed without having to manually check the app.
- **Record Keeping**: Both parties have a permanent record of all status changes within the message history.
- **Direct Engagement**: Buyers can immediately reply to a status update message if they have specific instructions for the farmer.
