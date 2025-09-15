# Herbera Admin Panel - Production Deployment Guide

This guide will help you deploy the Herbera admin panel to production at `admin.herbera.in` using your existing Supabase database schema.

## 🚀 Quick Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://admin.herbera.in
NODE_ENV=production

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_strong_random_jwt_secret_here_at_least_32_chars

# Admin Configuration
ADMIN_EMAIL=shantanupawar101@gmail.com
```

**Important:**

- Replace `your_supabase_project_url` with your actual Supabase project URL
- Replace `your_supabase_anon_key` with your Supabase anon public key
- Replace `your_supabase_service_role_key` with your Supabase service role key (keep this secret!)
- Generate a strong JWT secret (at least 32 characters, random)

### 3. Database Setup

Since you already have existing tables, you can skip the database creation. However, you may need to ensure you have all required tables.

#### Step 3.1: Check/Update Database Schema (Optional)

If you want to ensure you have all the latest tables and functions:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Review the contents of `database/setup.sql`
4. Run only the parts you need (new tables, indexes, policies, etc.)

#### Step 3.2: Create Admin User

You have 3 options to create an admin user:

**Option A: Using the Node.js Script (Recommended)**

```bash
npm install
node scripts/create-admin-user.js
```

**Option B: Via Supabase Dashboard**

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add user"
3. Create user with email: `shantanupawar101@gmail.com`
4. Set password as: `Shantanu@123`
5. After user is created, run this SQL in your SQL Editor:

```sql
UPDATE profiles
SET role = 'admin', full_name = 'Shantanu Pawar'
WHERE email = 'shantanupawar101@gmail.com';
```

**Option C: Manual SQL (Advanced)**
If your profiles table doesn't exist, first create it, then:

```sql
-- First create the user in auth.users (this might require service role)
-- Then update the profile
UPDATE profiles
SET role = 'admin'
WHERE email = 'shantanupawar101@gmail.com';
```

### 4. Deploy to Production

#### Option A: Deploy to Vercel (Recommended)

1. **Connect GitHub Repository:**

   - Push your code to GitHub
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project" and import your repository

2. **Configure Environment Variables:**

   - In Vercel project settings, go to "Environment Variables"
   - Add all the variables from your `.env.local` file

3. **Configure Custom Domain:**

   - In Vercel project settings, go to "Domains"
   - Add `admin.herbera.in` as a custom domain
   - Configure DNS records as instructed by Vercel

4. **Deploy:**
   - Vercel will automatically deploy on every push to main branch
   - Your app will be available at `https://admin.herbera.in`

#### Option B: Deploy to Netlify

1. **Build the Project:**

```bash
npm run build
```

2. **Deploy:**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables in Netlify settings

#### Option C: Deploy to Your Own Server

1. **Build the Project:**

```bash
npm run build
```

2. **Start Production Server:**

```bash
npm start
```

3. **Configure Reverse Proxy (Nginx):**

```nginx
server {
    listen 80;
    server_name admin.herbera.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. SSL Certificate

Configure SSL certificate for `admin.herbera.in`:

#### For Vercel/Netlify:

- SSL is automatically provided

#### For Custom Server:

```bash
# Using Certbot (Let's Encrypt)
sudo certbot --nginx -d admin.herbera.in
```

### 6. DNS Configuration

Configure your DNS to point `admin.herbera.in` to your deployment:

#### For Vercel:

- Add a CNAME record: `admin` → `cname.vercel-dns.com`
- Or A record pointing to Vercel's IP

#### For Netlify:

- Add a CNAME record: `admin` → `your-app.netlify.app`

#### For Custom Server:

- Add an A record: `admin` → `your-server-ip`

## 🔧 Configuration Details

### Authentication System

This app uses **Supabase Auth** with the following flow:

1. Users authenticate via Supabase Auth (`auth.users`)
2. User profiles are stored in `profiles` table
3. Admin access is controlled by `role` field in profiles table
4. JWT tokens are generated for session management

### Database Schema Overview

Your existing tables are used:

- `profiles` - User profiles with role-based access
- `addresses` - Customer addresses
- `categories` - Product categories
- `products` - Product catalog
- `product_images` - Product images
- `product_variants` - Product variants
- `orders` - Customer orders
- `order_items` - Order line items
- `order_status_history` - Order tracking
- `coupons` - Discount coupons
- `coupon_usage` - Coupon usage tracking
- `product_reviews` - Customer reviews

### JWT Secret Generation

Generate a strong JWT secret:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Security Considerations

1. **Environment Variables:** Never commit your `.env` file to version control
2. **JWT Secret:** Use a strong, unique secret for production
3. **Service Role Key:** Keep your Supabase service role key secure
4. **HTTPS:** Always use HTTPS in production
5. **RLS:** Row Level Security is enabled on all tables
6. **Admin Access:** Only users with `role='admin'` in profiles table can access admin APIs

## 📱 Admin Login

Once deployed, you can log in to your admin panel:

- **URL:** `https://admin.herbera.in`
- **Email:** `shantanupawar101@gmail.com`
- **Password:** `Shantanu@123`

**Security Note:** Change the default password after first login!

## 🔍 Testing

### Local Testing

```bash
# Start development server
npm run dev

# Test login at http://localhost:3000
```

### Production Testing

1. Visit `https://admin.herbera.in`
2. Log in with the admin credentials
3. Test all major features:
   - Dashboard statistics
   - Product management
   - Order management
   - Category management
   - Coupon management
   - Review moderation

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors:**

   - Check JWT_SECRET is set correctly
   - Verify Supabase service role key is correct
   - Ensure user has `role='admin'` in profiles table

2. **Database Connection Issues:**

   - Verify Supabase URL and keys
   - Check if all required tables exist
   - Verify Row Level Security policies allow service role access

3. **Build Errors:**

   - Ensure all dependencies are installed
   - Check for TypeScript errors
   - Verify all environment variables are set

4. **User Creation Issues:**
   - Make sure profiles table exists
   - Check if user registration trigger is working
   - Verify RLS policies allow profile creation

### Logs

Check application logs for errors:

```bash
# Vercel
vercel logs

# Netlify
netlify logs

# Custom server
pm2 logs # if using PM2
```

### Database Issues

Check Supabase logs:

1. Go to your Supabase dashboard
2. Navigate to Logs
3. Check for authentication and database errors

## 🔄 Updates

To update the application:

1. Pull latest changes from repository
2. Run database migrations if any
3. Deploy using your chosen method
4. Test functionality

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the application logs
3. Verify all environment variables are correct
4. Ensure database schema matches your existing tables
5. Check Supabase dashboard for auth/database errors

---

## 📋 Deployment Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database tables exist and are accessible
- [ ] Admin user created with correct role
- [ ] Application built successfully (`npm run build`)
- [ ] Domain configured (`admin.herbera.in`)
- [ ] SSL certificate configured
- [ ] DNS records configured
- [ ] Login functionality tested
- [ ] All admin features tested
- [ ] Supabase Auth integration working
- [ ] Database queries working correctly

**Your Herbera Admin Panel is ready! 🎉**
