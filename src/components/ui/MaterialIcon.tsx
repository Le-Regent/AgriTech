'use client';

import React, { useEffect } from 'react';

// Extensive dictionary of high-quality, lightweight line SVGs 
// configured precisely for Cameroon's bandwidth constraints
const SVG_ICONS: Record<string, string> = {
  // Navigation & Core Features
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  storefront: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7m-2 0v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7m9 14h-4v-4h4z"/><path d="M3 12H21"/>',
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  dashboard_customize: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  grid_view: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  
  // Crop Doctor & Biotech & Eco
  biotech: '<path d="M6 18h8M3 22h12M9 18v-4M19 14a5 5 0 0 0-5-5H9M14 9V5a3 3 0 0 1 6 0v4"/><circle cx="11" cy="6" r="2"/>',
  potted_plant: '<path d="M7 11h10l-1 8H8l-1-8z"/><path d="M12 3v8M9 6a3 3 0 0 1 3-3 3 3 0 0 1 3 3"/>',
  eco: '<path d="M12 2c5.5 0 10 4.5 10 10 0 2.12-.66 4.07-1.78 5.68l-1.42-1.42A7.93 7.93 0 0 0 20 12c0-4.41-3.59-8-8-8s-8 3.59-8 8c0 1.9.66 3.63 1.76 5.02L4.34 18.44C3.16 16.79 2.5 14.47 2.5 12c0-5.5 4.5-10 10-10z"/><path d="m12 12 4-4m-4 4-4-4m4 4v8"/>',
  psychology: '<path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6a4 4 0 0 0-4 4h2a2 2 0 0 1 2-2 2 2 0 0 1 2 2c0 2-3 1.5-3 3.5v1.5h2v-1c0-1 3-1.5 3-3a4 4 0 0 0-4-4z"/><circle cx="12" cy="17" r="1"/>',
  bug_report: '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="M12 6V3M8 12H5M19 12h-3M6 7l3 1.5M18 7l-3 1.5M6 17l3-1.5M18 17l-3-1.5"/>',
  microbiology: '<circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1 0 10 10M12 12l5 5M12 12l-4-4M19 5l2 2m-2 0 2-2M15 3h1M15 7h1"/>',
  science: '<path d="M16 3H8v4L3 18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2L16 7V3z"/><path d="M6 14h12"/>',

  // Logistics & Locations
  local_shipping: '<rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  location_on: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  arrow_back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  arrow_forward: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  south: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
  north: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',

  // Telemetry & Hardware Sensors
  wifi_tethering: '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.59 16.11a6 6 0 0 1 6.82 0"/><circle cx="12" cy="19" r="1"/>',
  sensors: '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.59 16.11a6 6 0 0 1 6.82 0"/><circle cx="12" cy="19" r="1"/>',
  nfc: '<rect x="2" y="2" width="20" height="20" rx="4"/><path d="M12 6a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4Z"/><path d="M12 10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z"/>',

  // Weather Metrics
  water_drop: '<path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13s-7 8.7-7 13a7 7 0 0 0 7 7z"/>',
  thermostat: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
  humidity_percentage: '<path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13s-7 8.7-7 13a7 7 0 0 0 7 7z"/><circle cx="12" cy="13" r="1"/>',
  light_mode: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  wb_sunny: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  cloudy: '<path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.25.26A5 5 0 0 0 6 13c0 3.31 2.69 6 6 6z"/>',
  cloud_off: '<path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5.1 5.1l13.8 13.8m-8.9-.41A5 5 0 0 1 5 18a5 5 0 0 0-5-5c0-2.6 1.9-4.8 4.5-5"/><path d="M1 1l22 22"/>',
  air: '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>',

  // History & Dates
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/><polyline points="12 7 12 12 16 14"/>',
  calendar_month: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  timer: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M12 2v2"/>',
  hourglass_disabled: '<path d="M5 2h14M19 22H5m12-20c0 4-4 7-4 7s4 3 4 7v1H7v-1c0-4 4-7 4-7s-4-3-4-7Z"/><line x1="1" y1="1" x2="23" y2="23"/>',
  trending_up: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  trending_down: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',

  // Chat & Communication
  forum: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h6"/>',
  chat_bubble: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  reply: '<polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',

  // Profile & Accounts
  account_circle: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  person: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  person_outline: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  person_search: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="3"/><line x1="22" y1="14" x2="21" y2="13"/>',
  group: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  group_add: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 11h6M22 8v6"/>',
  agriculture: '<path d="M3 20h18M16 20a4 4 0 0 0-8 0M12 2v10M12 6a3 3 0 0 0-3-3H6v3a3 3 0 0 0 3 3h3"/>',

  // Shopping & eCommerce
  shopping_cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  shopping_cart_off: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M4 4h1.5l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L22 7m-3-3H6"/><line x1="1" y1="1" x2="23" y2="23"/>',
  shopping_basket: '<path d="M3 9h18M3 9s1.5-6 9-6 9 6 9 6V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M12 9v13"/>',
  shopping_basket_outline: '<path d="M3 9h18M3 9s1.5-6 9-6 9 6 9 6V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>',
  shopping_bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  receipt_long: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8H8m8 4H8m8 4H8"/>',
  insights: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/><path d="M3 3v18h18"/>',
  inventory: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>',
  inventory_2: '<path d="M21 8v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/>',

  // Payments, Security, and Wallets
  payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="12" cy="14" r="2"/>',
  account_balance_wallet: '<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-5c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1h5z"/>',
  account_balance_wallet_outline: '<path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-5c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1h5z"/>',
  credit_card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  local_atm: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3"/>',
  account_balance: '<path d="M3 22h18M3 10h18M3 14h18M5 6l7-4 7 4M4 18h2v-4H4zm6 0h2v-4h-2zm6 0h2v-4h-2zm-12 0h2v-4H4z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  security: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 11 13 15 9"/>',
  shield_with_heart: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 1 0 0 5z"/>',
  verified_user: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 11 13 15 9"/>',
  admin_panel_settings: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',

  // Controls, Settings, & Utilities
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  settings_suggest: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  tune: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  sort: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/>',
  filter_list: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/>',
  gavel: '<path d="m14 13-5 5M4.8 13.4l2.8-2.8m-1.4-1.4L9 12M15 6.6l2.8-2.8M13.6 2.4l2.8 2.8M18.8 7.6l-5.6 5.6M12.4 12V6M9.5 5.5l5.5 5.5M2 22h20"/>',
  gavel_admin: '<path d="m14 13-5 5M4.8 13.4l2.8-2.8m-1.4-1.4L9 12M15 6.6l2.8-2.8M13.6 2.4l2.8 2.8M18.8 7.6l-5.6 5.6M12.4 12V6M9.5 5.5l5.5 5.5M2 22h20"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/><rect x="2" y="3" width="20" height="18" rx="2" ry="2"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  add: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  remove: '<line x1="5" y1="12" x2="19" y2="12"/>',
  add_circle: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
  cancel: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  block: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><path d="M12 15v3"/>',
  lock_reset: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><path d="M12 15v3"/>',
  vpn_key: '<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',

  // Media, Photos & Sound Response
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  photo_camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  volume_up: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  volume_off: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>',

  // Actions & File Operations
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  upload_file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  edit_note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  description: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
  delete: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  delete_sweep: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  sync: '<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>',
  content_cut: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="9.8" y1="8.2" x2="20" y2="18"/><line x1="9.8" y1="15.8" x2="20" y2="6"/>',

  // Chevron Controls
  chevron_left: '<polyline points="15 18 9 12 15 6"/>',
  chevron_right: '<polyline points="9 18 15 12 9 6"/>',

  // Icons for Status, Notifications & Rating
  progress_activity: '<circle cx="12" cy="12" r="10" stroke-dasharray="3 3"/><path d="M12 2 a10 10 0 0 1 10 10"/>',
  check_circle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  verified: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/><path d="m9 11 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  info_outline: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  error_outline: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  report: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  notifications: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  notifications_off: '<path d="M13.73 21a2 2 0 0 1-3.46 0m5.17-10.3A6 6 0 0 0 6 8c0 1.9.8 3.5 1.7 4.7m3.1 3.1c-1.3.4-2.8.2-3.8-.4V8a6 6 0 0 1 .4-2M1 1l22 22"/>',
  auto_awesome: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  
  // Stars (Scale & Outline supported dynamically!)
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  star_border: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  favorite: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  favorite_border: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  thumb_up: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  feedback: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
};

// Returns raw SVG HTML string formatted correctly to match the exact dimensions/stroke
// specified by Tailwind utility classes in parent elements
export function getSvgIconMarkup(name: string, classList: string = ''): string {
  const normName = name.trim().toLowerCase();
  
  // Custom adjustments based on filled styles
  const isFilled = classList.includes('fill-1') || classList.includes('filled');
  const strokeWidth = normName === 'progress_activity' ? '2.5' : '2.0';
  
  // Retrieve paths or use fallback dot/leaf hybrid (super light!)
  const paths = SVG_ICONS[normName] || '<circle cx="12" cy="12" r="6"/><path d="M12 2a15 15 0 0 1 0 20"/>';
  
  return `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      width="24" 
      height="24" 
      fill="${isFilled ? 'currentColor' : 'none'}" 
      stroke="currentColor" 
      stroke-width="${strokeWidth}" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      class="svg-inline-icon inline-block w-full h-full"
      style="pointer-events: none; transition: fill 0.2s, stroke 0.2s;"
    >
      ${paths}
    </svg>
  `;
}

// React component wrapper for standard direct use
export function MaterialIcon({ 
  name, 
  className = '', 
  style = {} 
}: { 
  name: string; 
  className?: string;
  style?: React.CSSProperties;
}) {
  const normName = name.trim().toLowerCase();
  const isFilled = className.includes('fill-1') || className.includes('filled');
  const paths = SVG_ICONS[normName] || '<circle cx="12" cy="12" r="6"/><path d="M12 2a15 15 0 0 1 0 20"/>';
  const strokeWidth = normName === 'progress_activity' ? '2.5' : '2.0';
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill={isFilled ? 'currentColor' : 'none'} 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`svg-inline-icon ${className}`}
      style={{ pointerEvents: 'none', ...style }}
    >
      <g dangerouslySetInnerHTML={{ __html: paths }} />
    </svg>
  );
}

// Highly performance-optimized observer component for complete application-wide backward compatibility
export function SvgIconHydrator() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fast static check for pre-rendered icons on initial load
    const processAllIcons = () => {
      const elements = document.querySelectorAll('.material-symbols-outlined, .material-symbols-rounded');
      elements.forEach((el) => {
        replaceIcon(el as HTMLElement);
      });
    };

    const replaceIcon = (el: HTMLElement) => {
      if (el.dataset.iconHydrated === 'true') return;
      
      const iconName = el.textContent?.trim();
      if (!iconName) return;
      
      // Cache original name and tag as hydrated to prevent recursive updates
      el.dataset.originalText = iconName;
      el.dataset.iconHydrated = 'true';
      
      const svgMarkup = getSvgIconMarkup(iconName, el.className);
      el.innerHTML = svgMarkup;
      
      // Align elements layout-compatibly
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.width = '1.15em';
      el.style.height = '1.15em';
      el.style.verticalAlign = 'middle';
      el.style.lineHeight = '1';
      el.style.overflow = 'hidden';
      el.style.color = 'inherit';
    };

    // Run first batch instantly
    processAllIcons();

    // Setup micro-latency MutationObserver to parse dynamically added or updated icons instantly
    const observer = new MutationObserver((mutations) => {
      let needsProcessing = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement) {
              if (
                node.classList.contains('material-symbols-outlined') || 
                node.classList.contains('material-symbols-rounded')
              ) {
                replaceIcon(node);
              }
              const children = node.querySelectorAll('.material-symbols-outlined, .material-symbols-rounded');
              if (children.length > 0) {
                children.forEach((child) => replaceIcon(child as HTMLElement));
              }
            }
          }
        } else if (mutation.type === 'characterData') {
          // If text inside a span changed
          const parent = mutation.target.parentElement;
          if (
            parent && 
            (parent.classList.contains('material-symbols-outlined') || 
             parent.classList.contains('material-symbols-rounded')) &&
            parent.dataset.iconHydrated !== 'true'
          ) {
            replaceIcon(parent);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Quick secondary check to handle any remaining slow mounts
    const timeout = setTimeout(processAllIcons, 100);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
