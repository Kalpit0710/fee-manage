# J.R. Preparatory School - Fee Management System
## Administrator Guide

### Table of Contents
1. [System Overview](#system-overview)
2. [Initial Setup](#initial-setup)
3. [User Management](#user-management)
4. [Academic Configuration](#academic-configuration)
5. [Fee Structure Setup](#fee-structure-setup)
6. [Database Management](#database-management)
7. [Security & Compliance](#security--compliance)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Features](#advanced-features)

---

## System Overview

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Can be deployed to Netlify, Vercel, or traditional hosting
- **Database**: PostgreSQL with Row Level Security (RLS)

### Key Features
✅ Multi-user access with role-based permissions
✅ Automated receipt generation with QR codes
✅ Quarter-based fee management
✅ Late fee calculation
✅ Comprehensive audit trails
✅ Two-factor authentication
✅ Session management with auto-logout
✅ Parent portal for fee inquiry
✅ CSV import/export capabilities

---

## Initial Setup

### 1. Supabase Configuration

#### Create Supabase Project
1. Go to https://supabase.com
2. Create a new organization
3. Create a new project
4. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep secure!)

#### Run Database Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order from `supabase/migrations/` folder
3. Verify all tables are created:
   - users
   - classes
   - students
   - quarters
   - fee_structures
   - extra_charges
   - transactions
   - audit_logs

### 2. Create Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Enter:
   - **Email**: admin@jrprep.edu
   - **Password**: Create a strong password
   - **Email Confirm**: ✅ Enable
4. Click "Create user"

### 3. Configure Environment

Update `.env.production` with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=production
```

### 4. Deploy Application

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

---

## User Management

### Creating Users

#### Admin Users
1. Create via Supabase Dashboard
2. Use email: `admin@yourschool.com`
3. User profile auto-created on first login
4. Role assigned: `admin`

#### Cashier Users
1. Create via Supabase Dashboard
2. Use email: `cashier@yourschool.com`
3. User profile auto-created on first login
4. Role assigned: `cashier`

### User Roles & Permissions

| Feature | Admin | Cashier |
|---------|-------|---------|
| Dashboard | ✅ | ✅ |
| View Students | ✅ | ✅ |
| Add/Edit Students | ✅ | ❌ |
| Quarters Management | ✅ | ❌ |
| Fee Structures | ✅ | ❌ |
| Extra Charges | ✅ | ❌ |
| Late Fee Config | ✅ | ❌ |
| Collect Fees | ✅ | ✅ |
| View Transactions | ✅ | ✅ |
| Generate Reports | ✅ | ✅ |
| Settings | ✅ | ❌ |
| Audit Logs | ✅ | ❌ |

### Deactivating Users

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Delete or disable the user

---

## Academic Configuration

### 1. Setup Classes

1. Navigate to Admin → Settings → Database
2. Or use SQL Editor:

```sql
INSERT INTO classes (class_name, display_order) VALUES
  ('Nursery', 1),
  ('KG', 2),
  ('Class 1', 3),
  ('Class 2', 4),
  ('Class 3', 5),
  ('Class 4', 6),
  ('Class 5', 7),
  ('Class 6', 8),
  ('Class 7', 9),
  ('Class 8', 10);
```

### 2. Setup Academic Quarters

1. Go to **Quarters** section
2. Click **"Add Quarter"**
3. For each quarter, enter:
   - Quarter Name (e.g., "Quarter 1")
   - Start Date
   - End Date
   - Due Date
   - Display Order

**Example Quarter Setup:**
- **Q1**: April - June (Due: May 31)
- **Q2**: July - September (Due: August 31)
- **Q3**: October - December (Due: November 30)
- **Q4**: January - March (Due: February 28)

### 3. Configure Fee Structures

1. Go to **Fee Structures** section
2. For each class, set:
   - **Registration Fee**: One-time fee
   - **Admission Fee**: One-time fee
   - **Quarterly Fee**: Per quarter amount
   - **Examination Fee**: Per quarter/year
   - **Other Fee**: Additional charges

**Best Practice**: Configure fees at the start of academic year.

### 4. Setup Extra Charges

1. Go to **Extra Charges** section
2. Add optional charges:
   - Transport Fee
   - Lab Fee
   - Library Fee
   - Sports Fee
   - Computer Fee
   - Uniform
   - Books
   - etc.

---

## Fee Structure Setup

### Understanding Fee Components

#### Base Fees (Per Student)
1. **Registration Fee**: One-time, first admission
2. **Admission Fee**: One-time, first admission
3. **Quarterly Fee**: Recurring every quarter
4. **Examination Fee**: As per schedule
5. **Other Fee**: Miscellaneous charges

#### Extra Charges (Optional)
- Can be assigned to specific students
- Can be one-time or recurring
- Tracked separately in transactions

#### Late Fees (Automatic)
- Configured per quarter or globally
- Can be percentage-based or flat amount
- Applied automatically after due date

### Setting Up Late Fee Rules

1. Go to **Late Fee Config**
2. Configure for each quarter:
   - **Enable Late Fee**: Toggle on/off
   - **Calculation Method**:
     - Percentage of pending amount
     - Flat amount
   - **Grace Period**: Days after due date
   - **Maximum Late Fee**: Cap amount

**Example Configuration:**
- 2% of pending amount after 7 days
- Maximum late fee: ₹500

---

## Database Management

### Data Import

#### Bulk Import Students (CSV)

1. Go to **Students** → **CSV Manager**
2. Download sample CSV template
3. Fill in student data:
   ```csv
   admission_no,name,father_name,dob,class_name,section,contact,email,address,concession
   2025001,John Doe,Robert Doe,2015-05-10,Class 1,A,9876543210,parent@email.com,Address,0
   ```
4. Upload CSV file
5. Review and confirm import

**Important Notes:**
- Admission numbers must be unique
- Class name must exist in system
- Date format: YYYY-MM-DD
- Concession in rupees

### Data Export

#### Export Student Data
1. Go to **Students**
2. Click **"Export to CSV"**
3. Save file for backup

#### Export Transaction Data
1. Go to **Transactions**
2. Set date range
3. Click **"Export"**
4. Choose format (CSV/Excel)

### Database Backup

#### Automated Backups
- Supabase provides daily automated backups
- Retained based on your plan (7-90 days)

#### Manual Backup
1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Click "Download Backup"
4. Store securely offline

**Best Practice**:
- Weekly manual backups
- Store in multiple locations
- Test restore process quarterly

---

## Security & Compliance

### Security Features Implemented

✅ **Authentication**
- Email/password authentication
- Password reset via email
- Session timeout (30 minutes)
- Two-factor authentication available

✅ **Authorization**
- Role-based access control (RBAC)
- Row Level Security (RLS) on all tables
- Backend enforcement via Supabase policies

✅ **Data Protection**
- HTTPS encryption in transit
- Database encryption at rest
- Secure password storage (hashed)
- No sensitive data in logs

✅ **Audit Trail**
- All actions logged
- User identification
- Timestamp tracking
- Change history maintained

### Compliance Checklist

- [ ] Enable 2FA for all admin accounts
- [ ] Review audit logs weekly
- [ ] Change default passwords
- [ ] Regular security updates
- [ ] Backup verification
- [ ] Access review quarterly
- [ ] Data retention policy
- [ ] Incident response plan

### Password Policy

**Requirements:**
- Minimum 6 characters
- Should include mix of letters, numbers, symbols
- Change every 90 days (recommended)
- No password reuse

### Session Management

**Settings:**
- **Timeout**: 30 minutes of inactivity
- **Visual Timer**: Displayed in header
- **Warning**: At 5 minutes remaining
- **Auto-logout**: At 0 minutes

---

## Backup & Recovery

### Backup Strategy

#### Daily Automated Backups
- Performed by Supabase
- Retention: Based on plan
- Location: Supabase infrastructure

#### Weekly Manual Backups
1. Export all data to CSV
2. Download database backup
3. Store in secure location
4. Verify backup integrity

#### Monthly Archive
1. Full database backup
2. Export all reports
3. Document system state
4. Store offline/cloud storage

### Recovery Procedures

#### Scenario 1: Accidental Data Deletion

1. Check audit logs for deletion record
2. Access Supabase Dashboard → Database
3. Use point-in-time recovery (if available)
4. Or restore from latest backup

#### Scenario 2: System Corruption

1. Deploy clean instance
2. Restore database from backup
3. Verify data integrity
4. Test all functions
5. Switch DNS to new instance

#### Scenario 3: Data Loss

1. Identify last known good backup
2. Restore database
3. Reconcile transactions manually
4. Update audit logs
5. Inform stakeholders

---

## Troubleshooting

### Common Issues

#### Issue: User Cannot Login

**Symptoms**: Login fails with correct credentials

**Solutions**:
1. Check Supabase Authentication status
2. Verify email in Supabase Dashboard
3. Reset password via "Forgot Password"
4. Check if user exists in `users` table
5. Verify RLS policies

#### Issue: Transactions Not Saving

**Symptoms**: Payment collected but not recorded

**Solutions**:
1. Check browser console for errors
2. Verify Supabase connection
3. Check database constraints
4. Review RLS policies on `transactions` table
5. Check audit logs for error messages

#### Issue: Reports Not Generating

**Symptoms**: Blank reports or errors

**Solutions**:
1. Verify data exists for selected filters
2. Check date range validity
3. Clear browser cache
4. Check database query performance
5. Review browser console errors

#### Issue: Slow Performance

**Symptoms**: Pages load slowly

**Solutions**:
1. Check database indexes
2. Review query performance in Supabase
3. Optimize large data queries
4. Check internet connection
5. Consider upgrading Supabase plan

### Performance Optimization

#### Database Optimization
1. Run VACUUM on database monthly
2. Rebuild indexes quarterly
3. Archive old transactions (>2 years)
4. Monitor query performance

#### Application Optimization
1. Enable caching for static data
2. Lazy load components
3. Optimize images
4. Use CDN for assets

---

## Advanced Features

### Custom Receipt Templates

Modify receipt appearance in:
`src/components/ReceiptGenerator.tsx`

Customize:
- School logo
- Colors and branding
- Layout and sections
- Additional information

### Email Notifications

Set up Supabase Edge Functions for:
- Payment confirmation emails
- Due date reminders
- Late fee notifications
- Monthly statements

### API Integration

The system can integrate with:
- SMS gateways for notifications
- Payment gateways (Razorpay, etc.)
- School management systems
- Accounting software

### Reporting Extensions

Add custom reports by:
1. Creating SQL queries in Supabase
2. Building UI components
3. Adding to Reports section

---

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check for failed transactions
- [ ] Review error logs
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Review audit logs
- [ ] Check system performance
- [ ] Update pending fees
- [ ] Generate collection reports

### Monthly Tasks
- [ ] Full data backup
- [ ] Security audit
- [ ] Performance review
- [ ] User access review
- [ ] Generate monthly reports

### Quarterly Tasks
- [ ] System updates
- [ ] Database optimization
- [ ] Disaster recovery test
- [ ] User training refresh

---

## Support & Resources

### Documentation
- **User Manual**: USER_MANUAL.md
- **Deployment Guide**: DEPLOYMENT.md
- **API Documentation**: Supabase auto-generated

### Technical Support
- **Email**: admin@jrprep.edu
- **Supabase Support**: support@supabase.io
- **Community**: GitHub Issues

### Updates & Maintenance
- Check for updates regularly
- Review changelog
- Test in staging before production
- Communicate changes to users

---

**Document Version**: 1.0
**Last Updated**: January 2025
**J.R. Preparatory School, Puranpur**
**System Administrator Guide**
