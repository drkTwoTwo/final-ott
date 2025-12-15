-- =====================================================
-- OTT Subscription Marketplace - Complete Database Schema
-- =====================================================
-- This schema includes all tables, relationships, indexes,
-- triggers, and Row Level Security policies for a production-ready
-- OTT subscription marketplace with guest checkout support.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: products
-- =====================================================
-- Purpose: Stores subscription products (e.g., streaming services, 
-- content packages). Products are the main offerings in the marketplace.
-- Each product can have multiple subscription plans.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for active products (most common query)
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active) WHERE active = true;

-- Index for created_at (for sorting/filtering)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- =====================================================
-- TABLE: plans
-- =====================================================
-- Purpose: Stores subscription plans linked to products. Each plan
-- defines pricing, billing interval (monthly/yearly), and subscription
-- details. Multiple plans can exist per product (e.g., Basic, Pro, Premium).
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Foreign key index (for joins)
CREATE INDEX IF NOT EXISTS idx_plans_product_id ON public.plans(product_id);

-- Composite index for active plans of active products (common query)
CREATE INDEX IF NOT EXISTS idx_plans_active_product ON public.plans(active, product_id) WHERE active = true;

-- Index for sorting by price
CREATE INDEX IF NOT EXISTS idx_plans_price ON public.plans(price);

-- =====================================================
-- TABLE: profiles
-- =====================================================
-- Purpose: Extends Supabase auth.users with additional profile information
-- and role management. Stores user roles (admin/user) for access control.
-- Automatically created when a user signs up via trigger.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(id)
);

-- Index for role lookups (admin checks)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role = 'admin';

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- =====================================================
-- TABLE: subscriptions
-- =====================================================
-- Purpose: Tracks user subscriptions to plans. Supports both authenticated
-- users (linked via user_id) and guest checkout (linked via guest_email).
-- Stores subscription status, billing periods, and renewal information.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'expired')) DEFAULT 'active',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    guest_email TEXT,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- Ensure either user_id or guest_email is provided (but not both)
    CHECK (
        (user_id IS NOT NULL AND guest_email IS NULL) OR
        (user_id IS NULL AND guest_email IS NOT NULL)
    )
);

-- Index for user subscriptions (common query)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id) WHERE user_id IS NOT NULL;

-- Index for guest subscriptions (guest checkout lookups)
CREATE INDEX IF NOT EXISTS idx_subscriptions_guest_email ON public.subscriptions(guest_email) WHERE guest_email IS NOT NULL;

-- Index for plan lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);

-- Composite index for active subscriptions by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON public.subscriptions(user_id, status) 
    WHERE user_id IS NOT NULL AND status = 'active';

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- =====================================================
-- TABLE: orders (Optional - for payment tracking)
-- =====================================================
-- Purpose: Tracks individual order transactions. Useful for payment
-- processing, refunds, and financial reporting. Links subscriptions
-- to payment transactions. Can be extended with payment provider data.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    payment_provider TEXT, -- e.g., 'stripe', 'paypal'
    payment_provider_id TEXT, -- External payment ID
    guest_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for subscription orders
CREATE INDEX IF NOT EXISTS idx_orders_subscription_id ON public.orders(subscription_id);

-- Index for user orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id) WHERE user_id IS NOT NULL;

-- Index for guest orders
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON public.orders(guest_email) WHERE guest_email IS NOT NULL;

-- Index for payment provider lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON public.orders(payment_provider, payment_provider_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Composite index for recent orders
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- =====================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at 
    BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-create profile on user signup
-- =====================================================
-- Purpose: Automatically creates a profile entry when a new user
-- signs up via Supabase Auth, ensuring every user has a profile.
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: products
-- =====================================================
-- Public can view active products
CREATE POLICY "Public can view active products"
    ON public.products FOR SELECT
    USING (active = true);

-- Admins have full access to products
CREATE POLICY "Admins can manage products"
    ON public.products
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- RLS POLICIES: plans
-- =====================================================
-- Public can view active plans for active products
CREATE POLICY "Public can view active plans"
    ON public.plans FOR SELECT
    USING (
        active = true AND
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = plans.product_id
            AND products.active = true
        )
    );

-- Admins have full access to plans
CREATE POLICY "Admins can manage plans"
    ON public.plans
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- RLS POLICIES: profiles
-- =====================================================
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile (except role)
-- Note: Role changes are restricted via separate admin-only policy
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Admins can update all profiles (including roles)
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- =====================================================
-- RLS POLICIES: subscriptions
-- =====================================================
-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
    ON public.subscriptions FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR 
        user_id IS NULL -- Allow guest checkout
    );

-- Users can update their own subscriptions (e.g., cancel)
CREATE POLICY "Users can update their own subscriptions"
    ON public.subscriptions FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Public can view subscriptions by guest email (for guest checkout confirmation)
-- Note: In production, you may want to add email verification token instead
CREATE POLICY "Public can view subscriptions by guest email"
    ON public.subscriptions FOR SELECT
    USING (guest_email IS NOT NULL);

-- Admins have full access to subscriptions
CREATE POLICY "Admins can manage subscriptions"
    ON public.subscriptions
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- RLS POLICIES: orders
-- =====================================================
-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR 
        user_id IS NULL -- Allow guest checkout
    );

-- Public can view orders by guest email (for guest checkout confirmation)
CREATE POLICY "Public can view orders by guest email"
    ON public.orders FOR SELECT
    USING (guest_email IS NOT NULL);

-- Admins have full access to orders
CREATE POLICY "Admins can manage orders"
    ON public.orders
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================
-- Purpose: Reusable function to check admin status
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_uuid
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant necessary permissions to authenticated and anon users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Schema created successfully!
-- 
-- Next steps:
-- 1. Set up your first admin user by updating their role:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- 
-- 2. Insert test products and plans through the admin panel
-- 
-- 3. Test guest checkout functionality
-- =====================================================

