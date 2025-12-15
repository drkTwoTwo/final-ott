# Database Schema Explanation

## Overview
This schema supports a production-ready OTT subscription marketplace with guest checkout, admin management, and secure data access.

---

## Table: `products`

**Purpose**: Stores the main subscription products offered in the marketplace (e.g., "Netflix", "Disney+", "Premium Sports Package").

**Why it exists**: Products are the primary entities that customers browse and subscribe to. Each product can have multiple pricing plans.

**Key Features**:
- UUID primary key for unique identification
- `active` flag to control visibility without deletion
- Timestamps for audit trails

---

## Table: `plans`

**Purpose**: Defines subscription plans for each product (e.g., "Basic Plan - $9.99/month", "Premium Plan - $19.99/year").

**Why it exists**: Products need flexible pricing options. Plans link to products via foreign key and define billing intervals (monthly/yearly), prices, and currencies.

**Key Features**:
- Foreign key to `products` (CASCADE delete)
- Price validation (>= 0)
- Billing interval constraint (month/year)
- Supports multiple currencies

---

## Table: `profiles`

**Purpose**: Extends Supabase `auth.users` with profile information and role-based access control (admin/user roles).

**Why it exists**: Supabase Auth handles authentication, but we need to store user roles and additional profile data. This table automatically syncs with auth.users via trigger.

**Key Features**:
- References `auth.users(id)` directly (one-to-one)
- Role-based access control (admin/user)
- Auto-created on user signup via trigger
- Allows profile extensions (full_name, etc.)

---

## Table: `subscriptions`

**Purpose**: Tracks active subscriptions linking users (or guests) to plans. Supports both authenticated users and guest checkout.

**Why it exists**: Core business logic - tracks who is subscribed to what, subscription status, billing periods, and renewal dates.

**Key Features**:
- Supports both `user_id` (authenticated) and `guest_email` (guest checkout)
- Status tracking (active, canceled, past_due, trialing, expired)
- Billing period tracking (start/end dates)
- Check constraint ensures either user_id OR guest_email (not both)

---

## Table: `orders`

**Purpose**: Records individual payment transactions and order history. Useful for financial reporting, refunds, and payment provider integration.

**Why it exists**: Subscriptions track the subscription lifecycle, but orders track payment transactions. Enables payment processing integration (Stripe, PayPal, etc.) and financial audits.

**Key Features**:
- Links to subscriptions and plans
- Payment provider tracking (Stripe ID, PayPal ID, etc.)
- Order status (pending, completed, failed, refunded)
- Supports both authenticated users and guest checkout
- Useful for reconciliation and reporting

---

## Security Model

### Row Level Security (RLS)

**Public Read Access**:
- Active products and plans are publicly readable
- Enables browsing without authentication

**Admin Write Access**:
- Only users with `role = 'admin'` in profiles can create/update/delete products and plans
- Admins have full CRUD access to all tables

**User Access**:
- Users can view/update their own profiles (except role)
- Users can create and view their own subscriptions
- Users can view their own orders

**Guest Access**:
- Guests can create subscriptions and orders (via guest_email)
- Guests can view their subscriptions/orders by email (with appropriate security measures)

---

## Performance Optimizations

### Indexes
- **Active products/plans**: Filtered indexes on `active = true` for faster public queries
- **Foreign keys**: Indexed for efficient joins
- **User lookups**: Indexed user_id and guest_email for subscription queries
- **Status filtering**: Indexed status columns for admin dashboards
- **Composite indexes**: Multi-column indexes for common query patterns

---

## Key Relationships

```
products (1) ──< (many) plans
plans (1) ──< (many) subscriptions
plans (1) ──< (many) orders
auth.users (1) ──< (1) profiles
auth.users (1) ──< (many) subscriptions
auth.users (1) ──< (many) orders
```

---

## Automatic Behaviors

1. **Profile Creation**: When a user signs up via Supabase Auth, a profile is automatically created with `role = 'user'`
2. **Timestamp Updates**: `updated_at` is automatically updated on row changes via triggers
3. **Cascade Deletes**: Deleting a product automatically deletes its plans (CASCADE)

---

## Setup Instructions

1. Run the complete SQL schema in Supabase SQL Editor
2. Create your first admin user:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE email = 'admin@yourdomain.com';
   ```
3. Insert test products and plans via admin panel
4. Test guest checkout functionality


