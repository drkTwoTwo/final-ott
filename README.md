# OTT Subscription Marketplace

A production-ready OTT (Over-The-Top) subscription marketplace built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Authentication**: User authentication with Supabase Auth
- 🛒 **Guest Checkout**: Support for checkout without account creation
- 👨‍💼 **Admin Panel**: Full CRUD operations for products and plans
- 🔒 **Row Level Security**: RLS policies for secure data access
- 📱 **Responsive Design**: Modern, mobile-friendly UI with Tailwind CSS
- 🎯 **Type Safety**: Full TypeScript support
- 🚀 **Production Ready**: Scalable architecture following best practices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Security**: Row Level Security (RLS) policies
- **Architecture**: Server Components, Client Components, Middleware

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd final-ott
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**

   Run the migration SQL file in your Supabase SQL Editor:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the migration

5. **Create your first admin user**

   After running the migration, create an admin user:
   ```sql
   -- First, sign up a user through the app, then run this SQL:
   -- Replace 'user-id-here' with the actual user ID from auth.users table
   
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('user-id-here', 'admin');
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
final-ott/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel routes
│   ├── auth/              # Authentication routes
│   ├── checkout/          # Checkout pages (user & guest)
│   ├── products/          # Public product pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── admin/            # Admin panel components
│   ├── auth/             # Authentication components
│   ├── checkout/         # Checkout components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   ├── auth.ts           # Authentication helpers
│   └── utils.ts          # Utility functions
├── types/                 # TypeScript type definitions
│   └── database.types.ts # Database schema types
├── supabase/             # Supabase configuration
│   └── migrations/       # Database migration files
└── middleware.ts         # Next.js middleware for auth
```

## Database Schema

### Tables

- **products**: Product catalog (streaming services, etc.)
- **plans**: Subscription plans linked to products
- **subscriptions**: User subscriptions (supports both user and guest)
- **user_roles**: User role management (admin/user)

### Row Level Security (RLS)

- **Products**: Public read access for active products, admin full access
- **Plans**: Public read access for active plans, admin full access
- **Subscriptions**: Users can view their own, admins have full access
- **User Roles**: Users can view their own role, admins can manage all

## Usage

### Admin Panel

1. Sign up or log in with an account that has admin privileges
2. Navigate to `/admin` to access the admin dashboard
3. Create products and plans through the admin interface
4. View all subscriptions

### Public Pages

1. Browse products at `/products`
2. View product details and plans at `/products/[id]`
3. Complete checkout as a logged-in user or guest

### Guest Checkout

- Guests can complete checkout with just an email address
- No account creation required
- Subscriptions are linked via `guest_email` field

## Security Notes

- **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- **RLS Policies**: All tables have RLS enabled with appropriate policies
- **Admin Access**: Only users with `role = 'admin'` in `user_roles` table can access admin routes
- **Middleware Protection**: Admin routes are protected at the middleware level

## Payment Integration

⚠️ **Note**: This application currently creates subscriptions without actual payment processing. In production, you should:

1. Integrate with a payment provider (Stripe, PayPal, etc.)
2. Add payment method collection in checkout forms
3. Implement webhook handlers for payment events
4. Update subscription status based on payment status

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Production Deployment

1. Set up your production Supabase project
2. Configure environment variables in your hosting platform
3. Run database migrations in production
4. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

## License

This project is licensed under the MIT License.
