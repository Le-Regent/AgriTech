-- 1. Profiles (User Management)
-- Extends Supabase Auth to store role-specific metadata.
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  user_type TEXT CHECK (user_type IN ('farmer', 'buyer')),
  avatar_url TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'standard',
  bio TEXT,
  location_name TEXT,
  phone_number TEXT,
  farm_name TEXT,
  website TEXT,
  gps_coords POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Products (Marketplace Listings)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  image_url TEXT,
  stock_quantity NUMERIC DEFAULT 0,
  initial_stock_quantity NUMERIC,
  min_quantity NUMERIC DEFAULT 1,
  max_quantity NUMERIC,
  is_verified BOOLEAN DEFAULT false,
  harvest_date DATE,
  harvest_season TEXT,
  health_status TEXT,
  certifications TEXT[],
  country TEXT,
  location TEXT,
  is_perishable BOOLEAN DEFAULT false,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Waste Analytics (Archived Expired Produce)
CREATE TABLE waste_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity_wasted NUMERIC NOT NULL,
  estimated_loss NUMERIC NOT NULL,
  reason TEXT DEFAULT 'expired',
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Diagnoses (AI Insights)
CREATE TABLE diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  crop_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  result_label TEXT,
  confidence NUMERIC,
  status TEXT,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Orders (Transactions)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'ESCROW_HELD', 'processing', 'shipped', 'delivered', 'COMPLETED', 'cancelled')) DEFAULT 'pending',
  total_amount NUMERIC NOT NULL,
  shipping_address TEXT,
  otp_code TEXT,
  evidence_url TEXT,
  tracking_number TEXT,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Order Items (Line Items)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  price_at_purchase NUMERIC NOT NULL
);

-- 6. Sensor Data (Real-time Monitoring)
CREATE TABLE sensor_data (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  field_sector TEXT,
  soil_moisture NUMERIC,
  temperature NUMERIC,
  humidity NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Messages (Direct Communication)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Product Reviews
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Payments (Stripe Integration)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  campay_reference TEXT UNIQUE,
  campay_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XAF',
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'escrow_held')) DEFAULT 'pending',
  method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('order', 'system', 'message', 'stock')),
  category TEXT DEFAULT 'primary',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Auth Trigger for Profiles
-- This function automatically creates a profile entry when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, user_type)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'user_type'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Helper function to check if a user is an admin without recursion
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can only update their own profile. Admins can manage all.
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL USING (check_is_admin());

-- Products: Anyone can read, only farmer can insert/update their own. Admins can manage all.
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Farmers can manage their own products" ON products FOR ALL USING (auth.uid() = farmer_id);
CREATE POLICY "Admins can manage all products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Diagnoses: Only the owner can see their diagnoses. Admins can manage all.
CREATE POLICY "Farmers can manage their own diagnoses" ON diagnoses FOR ALL USING (auth.uid() = farmer_id);
CREATE POLICY "Admins can manage all diagnoses" ON diagnoses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Orders: Buyers can see their own orders. Farmers can see orders for their products. Admins manage all.
CREATE POLICY "Buyers can view their own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Farmers can view orders for their products" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM order_items
    JOIN products ON products.id = order_items.product_id
    WHERE order_items.order_id = orders.id AND products.farmer_id = auth.uid()
  )
);
CREATE POLICY "Farmers can update status of orders for their products" ON orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM order_items
    JOIN products ON products.id = order_items.product_id
    WHERE order_items.order_id = orders.id AND products.farmer_id = auth.uid()
  )
);
CREATE POLICY "Buyers can create their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Order Items: Buyers can manage items for their own orders. Farmers can see items for their products.
CREATE POLICY "Buyers can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Farmers can view order items for their products" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = order_items.product_id AND products.farmer_id = auth.uid())
);
CREATE POLICY "Buyers can insert their own order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Sensor Data: Only the owner can see their sensor data. Admins can manage all.
CREATE POLICY "Farmers can manage their own sensor data" ON sensor_data FOR ALL USING (auth.uid() = farmer_id);
CREATE POLICY "Admins can manage all sensor data" ON sensor_data FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Messages: Users can see messages they sent or received.
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Product Reviews: Anyone can read, only authenticated users can create.
CREATE POLICY "Anyone can view reviews" ON product_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Payments: Only the buyer (via order) or admin can see payments.
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Users can create their own payments" ON payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Notifications: Users can manage their own notifications.
CREATE POLICY "Users can manage their own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Waste Analytics: Farmers can view their own, admins manage all.
CREATE POLICY "Farmers can view their own waste logs" ON waste_analytics FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Admins can manage all waste logs" ON waste_analytics FOR ALL USING (check_is_admin());

-- 8. Schema Permissions
-- Ensure the public schema is accessible to all necessary roles.
-- This fixes "permission denied for schema public" errors.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Ensure future tables also have these permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
