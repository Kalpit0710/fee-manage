# J.R. Preparatory School - Fee Management System
## Deployment Guide

### Prerequisites

1. **Node.js & npm**: Version 18 or higher
2. **Supabase Account**: Already configured with connection details in `.env` file
3. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

---

## Deployment Steps

### 1. Initial Setup (Already Complete)

Your system is already configured with:
- ✅ Database schema created
- ✅ RLS policies enabled
- ✅ Performance indexes added
- ✅ Audit trail system
- ✅ Environment variables set

### 2. Install Dependencies

```bash
npm install
```

### 3. Build for Production

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### 4. Preview Production Build (Optional)

```bash
npm run preview
```

Access at: http://localhost:4173

---

## Deployment Options

### Option A: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Option B: Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

3. Set environment variables in Netlify dashboard

### Option C: Deploy to Any Web Host

1. Upload contents of `dist/` folder to your web server
2. Configure environment variables on your hosting platform
3. Ensure your server supports SPA routing (redirect all routes to index.html)

---

## Post-Deployment Configuration

### 1. Create Admin Users

Go to your Supabase Dashboard → Authentication → Users

Create users with these emails:
- **Admin**: admin@jrprep.edu
- **Cashier**: cashier@jrprep.edu

Set strong passwords for both accounts.

### 2. Configure Email Settings (For Password Reset)

In Supabase Dashboard → Authentication → Email Templates:
- Enable "Confirm signup" template
- Enable "Reset password" template
- Update email templates with your school branding

### 3. Set Up Backup Schedule

In Supabase Dashboard → Settings → Database:
- Enable daily automated backups
- Configure backup retention period
- Test backup restoration process

### 4. Configure Domain (If using custom domain)

1. Update Supabase authentication settings with your domain
2. Add your domain to allowed redirect URLs
3. Update CORS settings if needed

---

## First Time Access

### Admin/Cashier Access

1. Navigate to: `https://yourdomain.com/admin`
2. Log in with admin credentials
3. System will create user profile automatically on first login

### Parent Portal Access

1. Navigate to: `https://yourdomain.com/parent-portal`
2. Enter student admission number
3. View fee details and payment history

---

## System Health Checks

After deployment, verify:

1. ✅ Admin login works
2. ✅ Dashboard loads with statistics
3. ✅ Student management functions properly
4. ✅ Fee structures can be created
5. ✅ Transactions can be recorded
6. ✅ Reports generate correctly
7. ✅ Parent portal accessible
8. ✅ Audit logs recording changes

---

## Performance Optimization

Your system includes:
- ✅ Database indexes for fast queries
- ✅ Pagination for large datasets
- ✅ Caching for frequently accessed data
- ✅ Optimized loading states
- ✅ Lazy loading of components

---

## Security Features

Your deployment includes:
- ✅ Row Level Security on all tables
- ✅ Session timeout (30 minutes inactivity)
- ✅ Password reset functionality
- ✅ Audit trail for all changes
- ✅ Role-based access control
- ✅ Secure authentication via Supabase

---

## Monitoring & Maintenance

### Daily Tasks
- Monitor transaction volumes
- Check for failed payments
- Review pending fee collections

### Weekly Tasks
- Review audit logs for unusual activity
- Check system performance metrics
- Verify backup completion

### Monthly Tasks
- Generate financial reports
- Archive old data if needed
- Update fee structures for new quarters
- Review and update user access

---

## Support & Troubleshooting

### Common Issues

**Issue**: Users can't log in
**Solution**: Check Supabase authentication status and user credentials

**Issue**: Data not loading
**Solution**: Verify environment variables and Supabase connection

**Issue**: Slow performance
**Solution**: Check database indexes and query performance in Supabase dashboard

### Getting Help

1. Check browser console for errors (F12)
2. Review Supabase logs in dashboard
3. Verify network requests in browser dev tools

---

## Important Notes

1. **Never commit `.env` file** to version control
2. **Keep Supabase credentials secure** - never share publicly
3. **Regular backups** are automated but test restoration periodically
4. **Monitor costs** in Supabase dashboard
5. **Update dependencies** regularly for security patches

---

## System URLs

- **Admin Panel**: `https://yourdomain.com/admin`
- **Parent Portal**: `https://yourdomain.com/parent-portal`
- **Public Portal**: `https://yourdomain.com/`

---

## Next Steps

1. ✅ Deploy the application
2. ✅ Create admin users
3. ✅ Set up quarters for academic year
4. ✅ Create fee structures
5. ✅ Import student data (CSV)
6. ✅ Configure message templates
7. ✅ Test complete workflow
8. ✅ Train staff on system usage

Your system is production-ready and fully functional!
