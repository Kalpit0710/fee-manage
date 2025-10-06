# J.R. Preparatory School - Fee Management System
## User Manual

### Table of Contents
1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Dashboard](#dashboard)
4. [Student Management](#student-management)
5. [Fee Collection](#fee-collection)
6. [Reports](#reports)
7. [Settings](#settings)
8. [Parent Portal](#parent-portal)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Login

1. Navigate to the admin login page: `https://yourschool.com/admin`
2. Enter your email and password provided by the administrator
3. Click "Sign In"

**Note**: If you don't have login credentials, contact your school administrator.

### Forgot Password?

1. Click "Forgot Password?" on the login page
2. Enter your registered email address
3. Click "Send Reset Link"
4. Check your email for the password reset link
5. Click the link and set your new password

---

## User Roles

### Admin
Full access to all features:
- Student management
- Fee structure configuration
- Quarter management
- Extra charges setup
- Late fee configuration
- Fee collection
- Transaction management
- Reports generation
- System settings
- User management

### Cashier
Limited access for daily operations:
- View student information
- Collect fees
- View transactions
- Generate receipts
- View basic reports

---

## Dashboard

The dashboard provides a quick overview of:

### Key Metrics
- **Total Students**: Current active students
- **Total Collection (This Month)**: Fees collected in the current month
- **Pending Amount**: Outstanding fees across all students
- **Overdue Students**: Students with payments past due date

### Recent Transactions
View the latest 10 fee transactions with:
- Student name
- Receipt number
- Amount paid
- Date and time

### Quick Actions
- Collect Fee
- Add Student
- View Reports

---

## Student Management

### Adding a New Student

1. Go to **Students** section
2. Click **"Add Student"** button
3. Fill in required information:
   - Admission Number (unique)
   - Student Name
   - Father's Name
   - Date of Birth
   - Select Class
   - Section (optional)
   - Contact Number
   - Email (optional)
   - Address
4. Set concession if applicable (in rupees)
5. Click **"Add Student"**

### Editing Student Information

1. Find the student in the list
2. Click the **Edit (pencil)** icon
3. Update the information
4. Click **"Update Student"**

### Searching Students

- Use the search bar to find students by:
  - Admission number
  - Student name
  - Father's name
- Filter by class using the dropdown

### Viewing Fee Details

1. Click the **"View Details"** icon next to a student
2. See quarterly fee breakdown
3. View payment history
4. Check pending amounts

---

## Fee Collection

### Collecting Fees

1. Go to **Fee Collection** section
2. Search for student by:
   - Admission Number, OR
   - Student Name
3. Click **Search**
4. Review student's fee details
5. Select the quarter to pay
6. Click **"Collect Payment"**
7. Choose payment mode:
   - **Cash**: Direct cash payment
   - **Cheque**: Enter cheque details
   - **UPI**: Enter UPI transaction ID
   - **Bank Transfer**: Enter reference number
8. Enter amount (pre-filled with balance)
9. Add notes if needed
10. Click **"Collect Payment"**
11. Receipt will be generated automatically

### Receipt Options

After successful payment:
- **Download PDF**: Full A4 size receipt for records
- **Print**:
  - Admin/Cashier: Half-size receipt (saves paper)
  - Parent Portal: Full-size receipt
- Receipt includes:
  - School information
  - Student details
  - Fee breakdown
  - QR code for verification

---

## Reports

### Available Reports

1. **Fee Collection Report**
   - Filter by date range
   - Filter by class
   - View total collections
   - Export to PDF or Excel

2. **Pending Fees Report**
   - Students with outstanding fees
   - Amount pending per student
   - Due date information

3. **Quarter-wise Report**
   - Collections per quarter
   - Pending amounts per quarter
   - Payment status overview

4. **Defaulters List**
   - Students with overdue payments
   - Days overdue
   - Late fees applied

### Generating Reports

1. Go to **Reports** section
2. Select report type
3. Choose filters (date range, class, etc.)
4. Click **"Generate Report"**
5. View results on screen
6. Download as PDF or Excel

---

## Settings

### School Settings (Admin Only)

Configure basic school information:
- School name
- Address
- Contact details
- Academic year
- Receipt prefix

### User Profile

Update your personal information:
- Name
- View email and role

### Security & Two-Factor Authentication

#### Enabling 2FA (Recommended for Admins)

1. Go to **Settings** → **Security & Audit**
2. Click **"Manage 2FA"**
3. Download an authenticator app:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
4. Scan the QR code with your app
5. Enter the 6-digit code from your app
6. Click **"Verify and Enable"**

#### Disabling 2FA

1. Go to **Settings** → **Security & Audit**
2. Click **"Manage 2FA"**
3. Click **"Disable 2FA"**
4. Confirm the action

### Audit Logs

View all system activities:
- User actions
- Changes made
- Timestamps
- User who performed the action

---

## Parent Portal

### Accessing Fee Details

Parents can check their ward's fee status:

1. Visit: `https://yourschool.com`
2. Enter student's **Admission Number**
3. Click **"Search"**
4. View:
   - Student information
   - Quarterly fee breakdown
   - Payment history
   - Pending amounts
   - Receipts

### Viewing Payment History

- See all past payments
- Download receipts
- Check due dates
- View late fees (if applicable)

---

## Troubleshooting

### Cannot Login

**Solution**:
- Verify email and password are correct
- Use "Forgot Password" to reset
- Contact administrator if issue persists

### Session Timeout

The system automatically logs you out after 30 minutes of inactivity.

**Solution**:
- Activity timer is shown in the header
- Move mouse or type to reset timer
- Log in again if session expired

### Payment Not Recorded

**Solution**:
1. Check Transactions section
2. Search by student name or admission number
3. Verify receipt number
4. Contact technical support if not found

### Receipt Not Printing

**Solution**:
- Check printer connection
- Try "Download PDF" instead
- Use browser print function (Ctrl+P)
- Ensure pop-ups are allowed

### Student Not Found

**Solution**:
- Verify admission number is correct
- Check spelling of student name
- Ensure student is active in the system
- Contact administrator to add/activate student

### Forgot Admission Number (Parents)

**Solution**:
- Contact school office
- Check school ID card
- Check previous fee receipts

---

## Best Practices

### For Admins
1. ✅ Regularly backup data
2. ✅ Enable 2FA for security
3. ✅ Review audit logs weekly
4. ✅ Generate monthly reports
5. ✅ Keep student information updated

### For Cashiers
1. ✅ Verify student details before collecting fee
2. ✅ Print/save receipt for every transaction
3. ✅ Double-check payment amounts
4. ✅ Enter correct payment mode and references
5. ✅ Hand over receipt to parent

### For Parents
1. ✅ Pay fees before due date to avoid late fees
2. ✅ Keep receipt numbers for reference
3. ✅ Download receipts for records
4. ✅ Note admission number for easy access

---

## Keyboard Shortcuts

- **Ctrl + K**: Quick search (when available)
- **Esc**: Close modals/dialogs
- **Tab**: Navigate between fields
- **Enter**: Submit forms

---

## Contact Support

For technical issues or questions:
- **Email**: support@jrprep.edu
- **Phone**: +91 98765 43210
- **Office Hours**: Monday - Saturday, 9:00 AM - 5:00 PM

For urgent issues during office hours, contact the school office directly.

---

## System Requirements

### Minimum Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Screen resolution: 1280x720 or higher

### Recommended
- Google Chrome (latest version)
- Stable internet connection (minimum 1 Mbps)
- Screen resolution: 1920x1080

---

**Document Version**: 1.0
**Last Updated**: January 2025
**J.R. Preparatory School, Puranpur**
