export interface User {
  id: string;
  full_name: string;
  email: string;
  user_type?: 'farmer' | 'buyer' | null;
  avatar_url?: string;
  last_active_at?: string;
  is_verified?: boolean;
  is_admin?: boolean;
  location_name?: string;
  phone_number?: string;
  bio?: string;
  farm_name?: string;
  website?: string;
  created_at?: string;
}

export interface CropDiagnosis {
  id: string;
  farmer_id: string;
  crop_type: string;
  image_url: string;
  result_label?: string;
  confidence?: number;
  status: string;
  recommendation?: string;
  created_at: string;
}

export interface Product {
  id: string;
  farmer_id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  image_url?: string;
  stock_quantity: number;
  initial_stock_quantity?: number;
  min_quantity?: number;
  max_quantity?: number;
  is_verified: boolean;
  harvest_date?: string;
  harvest_season?: string;
  health_status?: string;
  certifications: string[];
  country?: string;
  location?: string;
  is_perishable?: boolean;
  expiry_date?: string;
  created_at: string;
  is_dummy?: boolean;
  // Join fields
  profiles?: User;
}

export interface Order {
  id: string;
  buyer_id: string;
  status: 'pending' | 'ESCROW_HELD' | 'processing' | 'shipped' | 'delivered' | 'COMPLETED' | 'cancelled';
  total_amount: number;
  shipping_address?: string;
  otp_code?: string;
  evidence_url?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

export interface SensorData {
  id: number;
  farmer_id: string;
  field_sector?: string;
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  recorded_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  // Join fields
  sender?: {
    full_name: string;
    avatar_url: string;
  };
  receiver?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Payment {
  id: string;
  order_id?: string;
  campay_reference?: string;
  campay_id?: string;
  stripe_payment_id?: string; // Kept for backward compatibility
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'escrow_held';
  method?: string;
  created_at: string;
}

export type NotificationCategory = 'primary' | 'proposition' | 'market' | 'climate' | 'system' | 'order';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  category: NotificationCategory;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface WasteAnalytics {
  id: string;
  farmer_id: string;
  product_name: string;
  category: string;
  quantity_wasted: number;
  estimated_loss: number;
  reason: string;
  expiry_date: string;
  created_at: string;
}
