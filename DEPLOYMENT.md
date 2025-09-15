# 🚀 Production Deployment Guide

This guide will help you deploy the Herbera Admin application to production.

## 📋 Prerequisites

- [Vercel](https://vercel.com) account (recommended)
- [Netlify](https://netlify.com) account (alternative)
- Supabase project with all tables created
- Domain name (admin.herbera.in)

## 🔧 Environment Variables

### For Vercel/Netlify Deployment:

1. **Copy your current `.env` file content**
2. **Update the production URL** in your deployment platform

### Required Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zhzzgujukusldiyqbrii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDU1NDMsImV4cCI6MjA3MjgyMTU0M30.T4w3ERypqtP1ExaymRtMu4-kaX_exwaPjcGxJ6ZFmqo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoenpndWp1a3VzbGRpeXFicmlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0NTU0MywiZXhwIjoyMDcyODIxNTQzfQ.RvNeFPqGA9KvQhZRYd6c1CbpmnvK96jBUOksw4KxF8A

# App Configuration
NEXT_PUBLIC_APP_URL=https://admin.herbera.in
NODE_ENV=production

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secure-jwt-secret-here

# Admin Configuration
ADMIN_EMAIL=shantanupawar101@gmail.com
```

## 🚀 Vercel Deployment (Recommended)

### Step 1: Prepare Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Production ready"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (see above)
5. Deploy!

### Step 3: Configure Domain

1. In Vercel dashboard, go to your project
2. Go to "Settings" → "Domains"
3. Add `admin.herbera.in` as custom domain
4. Configure DNS records as instructed

## 🌐 Netlify Deployment (Alternative)

### Step 1: Build Settings

- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18.x

### Step 2: Environment Variables

Add all environment variables in Netlify dashboard under "Site settings" → "Environment variables"

### Step 3: Deploy

1. Connect your GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy!

## 🔒 Security Considerations

### 1. Change JWT Secret

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

### 2. Update Environment Variables

- Use a different JWT secret for production
- Consider using environment-specific admin emails
- Ensure all secrets are properly secured

### 3. Supabase RLS Policies

Make sure your Supabase RLS policies are properly configured for production.

## 📊 Monitoring & Analytics

### 1. Vercel Analytics

- Enable Vercel Analytics in your dashboard
- Monitor performance and errors

### 2. Supabase Monitoring

- Check Supabase dashboard for database performance
- Monitor API usage and limits

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 Troubleshooting

### Common Issues:

1. **Build Failures**

   - Check Node.js version (use 18.x)
   - Verify all environment variables are set
   - Check for TypeScript errors

2. **Runtime Errors**

   - Check browser console for errors
   - Verify Supabase connection
   - Check API endpoints

3. **Image Upload Issues**
   - Verify Supabase Storage bucket exists
   - Check RLS policies for storage
   - Verify CORS settings

## 📝 Post-Deployment Checklist

- [ ] Domain is properly configured
- [ ] SSL certificate is active
- [ ] All environment variables are set
- [ ] Admin user can log in
- [ ] Image uploads work
- [ ] All API endpoints respond correctly
- [ ] Database connections are working
- [ ] Performance is acceptable

## 🎯 Production URLs

- **Admin Panel**: https://admin.herbera.in
- **API Base**: https://admin.herbera.in/api
- **Supabase Dashboard**: https://supabase.com/dashboard

## 📞 Support

If you encounter any issues during deployment, check:

1. Vercel/Netlify build logs
2. Browser console errors
3. Supabase dashboard for database issues
4. Network tab for API call failures

---

**Note**: This application is now production-ready with proper environment configuration, security headers, and optimization settings.
