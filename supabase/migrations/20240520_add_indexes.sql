-- Database Indexing Optimization

-- Use these queries in your Supabase SQL Editor to improve performance

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_campay_reference ON payments(campay_reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Composite index for frequent marketplace queries (user + status)
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);

-- Index for campay reconciliation
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
