import { ReactNode } from 'react';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'farmer' | 'buyer' | string;
  avatar_url?: string;
  is_verified?: boolean;
  is_admin?: boolean;
  location_name?: string;
  phone_number?: string;
  bio?: string;
  farm_name?: string;
  website?: string;
  created_at?: string;
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
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
  is_verified: boolean;
  harvest_date?: string;
  harvest_season?: string;
  health_status?: string;
  certifications: string[];
  country?: string;
  location?: string;
  created_at: string;
  // Join fields
  profiles?: User;
}

export interface Order {
  id: string;
  buyer_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  total_amount: number;
  shipping_address?: string;
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
  stripe_payment_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
}
