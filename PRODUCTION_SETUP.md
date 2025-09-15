# 🚀 Production Setup Guide

## 📝 Changes Required in Your `.env` File

### Current `.env` File (Development):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zhzzgujukusldiyqbrii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDU1NDMsImV4cCI6MjA3MjgyMTU0M30.T4w3ERypqtP1ExaymRtMu4-kaX_exwaPjcGxJ6ZFmqo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0NTU0MywiZXhwIjoyMDcyODIxNTQzfQ.RvNeFPqGA9KvQhZRYd6c1CbpmnvK96jBUOksw4KxF8A

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# JWT Secret for admin tokens
JWT_SECRET=herberaco@123

# Admin Configuration
ADMIN_EMAIL=shantanupawar101@gmail.com
```

### Updated `.env` File (Production Ready):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zhzzgujukusldiyqbrii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDU1NDMsImV4cCI6MjA3MjgyMTU0M30.T4w3ERypqtP1ExaymRtMu4-kaX_exwaPjcGxJ6ZFmqo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0NTU0MywiZXhwIjoyMDcyODIxNTQzfQ.RvNeFPqGA9KvQhZRYd6c1CbpmnvK96jBUOksw4KxF8A

# App Configuration
NEXT_PUBLIC_APP_URL=https://admin.herbera.in
NODE_ENV=production

# JWT Secret for admin tokens (CHANGE THIS!)
JWT_SECRET=your-super-secure-production-secret-here

# Admin Configuration
ADMIN_EMAIL=shantanupawar101@gmail.com
```

## 🔄 What Changed:

### ✅ **Automatic Environment Detection**

The app now automatically detects the environment and uses the correct URLs:

- **Development**: `http://localhost:3000`
- **Production**: `https://admin.herbera.in`

### ✅ **Centralized Configuration**

All environment variables are now managed through `lib/config.ts`:

```typescript
// Automatically uses production URL when NODE_ENV=production
const appUrl = config.getAppUrl();
```

### ✅ **Production Optimizations**

- Image optimization enabled for production
- Security headers added
- Compression enabled
- Performance optimizations

## 🚨 **IMPORTANT: Security Changes Required**

### 1. **Change JWT Secret**

```bash
# Generate a secure secret
openssl rand -base64 32

# Or use this online generator
# https://generate-secret.vercel.app/32
```

### 2. **Update Your `.env` File**

Replace `JWT_SECRET=herberaco@123` with your secure secret.

## 🚀 **Deployment Steps**

### For Vercel:

1. Update your `.env` file with production URL
2. Change JWT secret to something secure
3. Push to GitHub
4. Deploy to Vercel
5. Add environment variables in Vercel dashboard

### For Netlify:

1. Update your `.env` file with production URL
2. Change JWT secret to something secure
3. Push to GitHub
4. Deploy to Netlify
5. Add environment variables in Netlify dashboard

## 🔧 **Environment Variables for Deployment Platforms**

When deploying, add these environment variables in your platform's dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zhzzgujukusldiyqbrii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDU1NDMsImV4cCI6MjA3MjgyMTU0M30.T4w3ERypqtP1ExaymRtMu4-kaX_exwaPjcGxJ6ZFmqo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0NTU0MywiZXhwIjoyMDcyODIxNTQzfQ.RvNeFPqGA9KvQhZRYd6c1CbpmnvK96jBUOksw4KxF8A
NEXT_PUBLIC_APP_URL=https://admin.herbera.in
NODE_ENV=production
JWT_SECRET=your-super-secure-production-secret-here
ADMIN_EMAIL=shantanupawar101@gmail.com
```

## ✅ **What's Now Production Ready**

- ✅ **Environment Detection**: Automatically uses production URLs
- ✅ **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- ✅ **Image Optimization**: Enabled for production
- ✅ **Compression**: Gzip compression enabled
- ✅ **Performance**: Optimized build settings
- ✅ **Error Handling**: Proper error boundaries
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Database**: Supabase integration ready

## 🎯 **Next Steps**

1. **Update your `.env` file** with the production URL
2. **Change the JWT secret** to something secure
3. **Deploy to your chosen platform** (Vercel/Netlify)
4. **Configure your domain** (admin.herbera.in)
5. **Test all functionality** in production

---

**Your app is now production-ready! 🎉**
