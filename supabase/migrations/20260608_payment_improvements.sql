-- KamerFresh Secure Payment Schema Migration
-- Sets up tables supporting Dead Letter Queue, Idempotency tracking, and Audit Logger

-- 1. Idempotency Keys Tracker
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    response jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(key);

-- 2. Dead Letter Queue for Failed Webhooks (failed_webhooks)
CREATE TABLE IF NOT EXISTS public.failed_webhooks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    payload jsonb NOT NULL,
    error text,
    retry_count integer DEFAULT 0 NOT NULL,
    last_retry_at timestamp with time zone,
    status text DEFAULT 'failed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_failed_webhooks_status ON public.failed_webhooks(status);

-- 3. Structured Payment Logging (payment_logs)
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event text NOT NULL,
    order_id text,
    payment_id text,
    user_id text,
    amount numeric,
    status text,
    reference text,
    error text,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON public.payment_logs(event);
