# Quick Start Guide
## J.R. Preparatory School - Fee Management System

---

## Getting Started (First Time Setup)

### Step 1: Access Admin Panel

Navigate to: `https://yourdomain.com/admin`

Log in with your credentials (created by system administrator in Supabase).

---

### Step 2: Set Up Academic Year

1. Go to **Quarters** section (sidebar)
2. Click **Add Quarter**
3. Create quarters for the academic year:
   - **Quarter 1**: April - June 2025
   - **Quarter 2**: July - September 2025
   - **Quarter 3**: October - December 2025
   - **Quarter 4**: January - March 2026

Fill in:
- Academic Year: `2025-26`
- Quarter Name: `Quarter 1`, `Quarter 2`, etc.
- Start Date, End Date, Due Date
- Click **Save**

---

### Step 3: Set Up Fee Structures

1. Go to **Fee Structures** section
2. Click **Add Fee Structure**
3. Select Class and Quarter
4. Enter fee amounts:
   - Tuition Fee: ₹1000
   - Transport Fee: ₹0 (if not applicable)
   - Activity Fee: ₹0 (if not applicable)
   - Examination Fee: ₹500
   - Other Fee: ₹0
5. Click **Save Fee Structure**

Repeat for all classes and quarters.

---

### Step 4: Add Students

**Option A: Import from CSV**

1. Go to **Students** section
2. Click **Download Template**
3. Fill in the template with student data
4. Click **Import CSV**
5. Upload your file

**Option B: Add Manually**

1. Go to **Students** section
2. Click **Add Student**
3. Fill in details:
   - Admission Number
   - Student Name
   - Class
   - Section
   - Parent Contact
   - Parent Email
   - Concession (if any)
4. Click **Save Student**

---

## Daily Operations

### Collecting Fees

1. Go to **Fee Collection** section
2. Search for student by:
   - Admission Number
   - Name
   - Class
3. Click **Collect Fee** on student card
4. Select Quarter
5. Review fee breakdown
6. Enter payment details:
   - Payment Mode (Cash/UPI/Cheque/Online)
   - Reference Number (if applicable)
   - Notes (optional)
7. Click **Submit Payment**
8. Receipt generates automatically
9. Print or email receipt to parent

---

### Viewing Transactions

1. Go to **Transactions** section
2. Use filters to find transactions:
   - Date range
   - Student
   - Payment mode
   - Status
3. View, edit, or download receipt
4. Export transactions to CSV

---

### Generating Reports

1. Go to **Reports** section
2. Select report type:
   - Collection Summary
   - Pending Fees
   - Class-wise Collection
   - Quarter-wise Collection
   - Payment Mode Analysis
3. Set date range
4. Click **Generate Report**
5. Export to CSV or print

---

## Parent Portal

### Parents Can:

1. Visit: `https://yourdomain.com/parent-portal`
2. Enter student admission number
3. View:
   - Student details
   - Fee structure for each quarter
   - Payment history
   - Outstanding balance
   - Receipts
4. Download/print receipts

No login required - secured by admission number.

---

## Advanced Features

### Bulk Messaging

1. Go to **Bulk Messaging** section
2. Select:
   - Message Type (Payment Reminder/Custom)
   - Recipients (All/By Class/By Quarter)
3. Customize message
4. Preview
5. Send to all parents

### Extra Charges

1. Go to **Extra Charges** section
2. Add charges for:
   - Specific student
   - Entire class
   - Entire quarter
3. Examples:
   - Exam fees
   - Event participation
   - Lost books
   - Late fines

### Audit Trail (Admin Only)

1. Go to **Settings** → **Security & Audit**
2. View all system changes:
   - Who made changes
   - What was changed
   - When it happened
3. Filter by:
   - Table
   - Action (Create/Update/Delete)
   - User
   - Date range

---

## Tips & Best Practices

### ✅ DO:
- Collect fees regularly
- Generate receipts for all payments
- Back up data weekly
- Review pending fees monthly
- Send payment reminders before due dates
- Train all staff on system usage

### ❌ DON'T:
- Share login credentials
- Delete transactions (mark as refunded instead)
- Modify fee structures after payments collected
- Leave browser logged in unattended (30-min timeout)

---

## Keyboard Shortcuts

- `Ctrl+S` - Save in most forms
- `Esc` - Close modals
- `Tab` - Navigate between fields
- `Enter` - Submit forms

---

## Mobile Access

The system is fully responsive and works on:
- Desktop computers
- Tablets
- Smartphones

All features available on mobile devices.

---

## Support

### For Technical Issues:
1. Check browser console (F12)
2. Clear browser cache
3. Try different browser
4. Contact system administrator

### For User Training:
- Refer to USER_MANUAL.md
- Watch tutorial videos (if available)
- Schedule training session with admin

---

## Security Reminders

- **Log out** when finished
- **Never share** passwords
- **Use strong** passwords
- **Report** suspicious activity
- **Auto-logout** after 30 minutes inactivity

---

## Quick Reference

| Task | Section | Action |
|------|---------|--------|
| Add Student | Students | Click "Add Student" |
| Collect Fee | Fee Collection | Search student → Collect Fee |
| View Receipt | Transactions | Click receipt number |
| Generate Report | Reports | Select type → Generate |
| Send Reminder | Bulk Messaging | Select recipients → Send |
| Add Extra Charge | Extra Charges | Add Charge |
| View Changes | Settings → Security | View audit logs |

---

Your system is ready to use! Start with quarterly setup, then add students, and begin collecting fees.
