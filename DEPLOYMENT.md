# Deployment Guide

## Environment Configuration

This application supports three environments:
- **Development**: Local development and testing
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

### Environment Variables

Each environment has its own configuration file:
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Environment
VITE_APP_ENV=production # or staging, development

# Monitoring (Optional but recommended for production)
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ENABLE_ANALYTICS=true

# Session Configuration
VITE_SESSION_TIMEOUT=1800000 # 30 minutes in milliseconds
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow for automated deployment.

### GitHub Secrets Setup

Configure the following secrets in your GitHub repository:

**Development:**
- `DEV_SUPABASE_URL`
- `DEV_SUPABASE_ANON_KEY`

**Staging:**
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SENTRY_DSN`

**Production:**
- `PROD_SUPABASE_URL`
- `PROD_SUPABASE_ANON_KEY`
- `PROD_SENTRY_DSN`

### Branch Strategy

- `develop` - Development environment
- `staging` - Staging environment
- `main` - Production environment

### Deployment Workflow

1. **Develop Branch**: Push to `develop` triggers development build
2. **Staging Branch**: Push to `staging` triggers staging build and deployment
3. **Main Branch**: Push to `main` triggers production build and deployment

## Manual Deployment

### Build for Specific Environment

```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build
```

### Deploy to Hosting Providers

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to production
netlify deploy --prod --dir=dist

# Deploy to staging
netlify deploy --alias=staging --dir=dist
```

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Deploy to staging
vercel
```

#### Traditional Hosting (Apache/Nginx)

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload the `dist/` folder to your web server

3. Configure your web server to serve the `index.html` for all routes

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name jrprep.edu;
    root /var/www/jrprep/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache Configuration (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Database Migration

Before deploying to a new environment:

1. Set up Supabase project for the environment
2. Run all migrations in order from `supabase/migrations/`
3. Create initial admin user via Supabase Dashboard
4. Configure Row Level Security policies

## Monitoring Setup

### Error Tracking with Sentry (Recommended)

1. Create a Sentry account at https://sentry.io
2. Create a new project for your application
3. Copy the DSN and add to environment variables
4. Errors will be automatically tracked in production

### Uptime Monitoring

Recommended services:
- **UptimeRobot** (Free): https://uptimerobot.com
- **Pingdom**: https://pingdom.com
- **StatusCake**: https://statuscake.com

Set up monitoring for:
- Main application URL
- Supabase API endpoint
- Critical application endpoints

### Health Check Endpoint

The application serves at `/` and can be monitored for uptime.

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test login functionality
- [ ] Verify database connection
- [ ] Test fee collection workflow
- [ ] Verify receipt generation
- [ ] Test payment processing (if applicable)
- [ ] Check session timeout functionality
- [ ] Verify role-based access control
- [ ] Test 2FA setup (for admin accounts)
- [ ] Check error tracking in Sentry
- [ ] Verify uptime monitoring is active
- [ ] Test backup/restore procedures

## Rollback Procedure

If deployment fails:

1. **Immediate Rollback**: Revert to previous deployment
2. **Check Logs**: Review error logs and monitoring
3. **Database**: Restore from backup if needed
4. **Notify**: Alert team of the rollback

## Support

For deployment issues:
- Check GitHub Actions logs
- Review Sentry error reports
- Check Supabase project logs
- Review application console logs
