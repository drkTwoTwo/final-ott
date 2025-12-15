# Project Structure Overview

## Directory Structure

```
final-ott/
├── app/                          # Next.js App Router pages
│   ├── admin/                   # Admin panel (protected)
│   │   ├── layout.tsx          # Admin layout with auth check
│   │   ├── login/              # Admin login page
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── products/           # Product management
│   │   ├── plans/              # Plan management
│   │   ├── orders/             # Orders management
│   │   └── subscriptions/      # Subscriptions view
│   ├── api/                     # API routes
│   │   └── webhooks/           # Payment webhooks
│   ├── auth/                    # Authentication pages
│   │   ├── login/              # User login
│   │   ├── signup/             # User signup
│   │   └── logout/             # Logout route
│   ├── checkout/                # Checkout flow
│   │   ├── [planId]/           # Checkout page (plan selection, contact)
│   │   └── success/            # Payment success page
│   ├── products/                # Public product pages
│   │   ├── page.tsx            # Products listing
│   │   └── [slug]/             # Product detail page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   └── globals.css             # Global styles
│
├── components/                  # React components
│   ├── admin/                   # Admin components
│   │   ├── AdminNavbar.tsx
│   │   ├── AdminLogoutButton.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductFormWithUpload.tsx
│   │   └── PlanForm.tsx
│   ├── auth/                    # Auth components
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── LogoutButton.tsx
│   ├── checkout/                # Checkout components
│   │   ├── CheckoutButton.tsx
│   │   ├── CheckoutForm.tsx
│   │   └── GuestCheckoutForm.tsx
│   └── layout/                  # Layout components
│       └── Navbar.tsx
│
├── lib/                         # Utility libraries
│   ├── api/                     # API clients
│   │   ├── edge-functions.ts   # Edge Function client
│   │   └── payments.ts          # Payment API client
│   ├── supabase/                # Supabase clients
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── admin.ts            # Admin client (service role)
│   ├── auth.ts                  # Auth utilities
│   ├── storage.ts               # Storage utilities
│   ├── utils.ts                 # General utilities
│   └── validation.ts            # Client-side validation
│
├── supabase/                     # Supabase configuration
│   ├── functions/                # Edge Functions
│   │   ├── _shared/            # Shared utilities
│   │   │   ├── auth.ts
│   │   │   ├── cors.ts
│   │   │   ├── supabase.ts
│   │   │   └── validation.ts
│   │   ├── admin/               # Admin functions
│   │   │   ├── create-product/
│   │   │   ├── update-product/
│   │   │   ├── delete-product/
│   │   │   ├── create-plan/
│   │   │   ├── update-plan/
│   │   │   └── admin-get-orders/
│   │   ├── create-payment/      # Payment creation
│   │   ├── verify-payment/     # Payment verification
│   │   ├── get-products-with-plans/
│   │   └── get-product-by-slug/
│   ├── migrations/              # Database migrations
│   │   ├── 001_complete_schema.sql
│   │   ├── 002_add_slug_and_stock.sql
│   │   ├── 003_add_category.sql
│   │   └── 004_add_phone_to_orders.sql
│   └── config.toml              # Supabase CLI config
│
├── types/                        # TypeScript types
│   └── database.types.ts        # Database schema types
│
├── public/                       # Static assets
├── middleware.ts                # Next.js middleware (auth protection)
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                  # Dependencies
└── README.md                     # Project documentation
```

## Key Files Explained

### Core Application Files

**`middleware.ts`**
- Protects admin routes
- Verifies authentication and admin role
- Handles session refresh

**`app/layout.tsx`**
- Root layout with Navbar
- Dark theme configuration

**`app/page.tsx`**
- Homepage with hero section
- Product cards with category filtering
- Search functionality

### Admin Panel

**`app/admin/layout.tsx`**
- Admin layout wrapper
- Dark theme styling

**`app/admin/page.tsx`**
- Dashboard with statistics
- Quick actions

**`components/admin/ProductFormWithUpload.tsx`**
- Product creation/editing form
- Image upload to Supabase Storage
- Full validation

### Checkout Flow

**`app/checkout/[planId]/page.tsx`**
- Plan selection (radio buttons)
- Contact details form (phone + email)
- Order summary sidebar
- Payment initiation

**`app/checkout/success/page.tsx`**
- Payment verification
- Order status display
- Success/pending/failed states

### Edge Functions

**`supabase/functions/create-payment/index.ts`**
- Creates payment intent
- Validates inputs
- Calls xtragateway.site API
- Creates order record

**`supabase/functions/verify-payment/index.ts`**
- Verifies payment status
- Updates order
- Creates subscription
- Decrements stock

### API Routes

**`app/api/webhooks/xtragateway/route.ts`**
- Receives payment callbacks
- Updates order status
- Creates subscriptions
- Handles stock

## Data Flow

### Product Display Flow
```
Homepage → Edge Function (get-products-with-plans) → Display Products
```

### Checkout Flow
```
Product Detail → Select Plan → Checkout Page → 
Edge Function (create-payment) → xtragateway.site → 
Webhook → Update Order → Success Page
```

### Admin Flow
```
Admin Login → Middleware Check → Admin Dashboard → 
CRUD Operations → Edge Functions → Database
```

## Security Layers

1. **Middleware:** Route protection
2. **Edge Functions:** Server-side validation
3. **RLS Policies:** Database-level security
4. **Input Validation:** Client and server
5. **Authentication:** Supabase Auth

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `XTRAGATEWAY_API_KEY`
- `XTRAGATEWAY_WEBHOOK_SECRET`

## Database Tables

- `products` - Product catalog
- `plans` - Subscription plans
- `orders` - Payment orders
- `subscriptions` - User subscriptions
- `profiles` - User profiles with roles

All tables have RLS enabled with appropriate policies.


