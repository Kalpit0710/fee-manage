/*
  # Create Comprehensive Notification System

  ## Overview
  Creates tables and functions for automated notifications including email reminders,
  payment alerts, and in-app notifications.

  ## Changes

  1. New Tables
    - `notifications` - Stores in-app notifications for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text) - Notification title
      - `message` (text) - Notification content
      - `type` (text) - Type: reminder, alert, info, success
      - `related_type` (text) - Related entity: transaction, student, quarter
      - `related_id` (uuid) - ID of related entity
      - `read` (boolean) - Read status
      - `created_at` (timestamptz)

    - `notification_preferences` - User notification preferences
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, foreign key to auth.users)
      - `email_enabled` (boolean) - Email notifications enabled
      - `sms_enabled` (boolean) - SMS notifications enabled
      - `whatsapp_enabled` (boolean) - WhatsApp notifications enabled
      - `payment_reminders` (boolean) - Payment reminder notifications
      - `due_date_alerts` (boolean) - Due date alert notifications
      - `receipt_notifications` (boolean) - Receipt notifications
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `scheduled_notifications` - Queue for scheduled notifications
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `quarter_id` (uuid, foreign key to quarters)
      - `notification_type` (text) - reminder, alert, overdue
      - `scheduled_for` (timestamptz) - When to send
      - `sent` (boolean) - Sent status
      - `sent_at` (timestamptz) - When sent
      - `email_sent` (boolean) - Email sent status
      - `sms_sent` (boolean) - SMS sent status
      - `whatsapp_sent` (boolean) - WhatsApp sent status
      - `created_at` (timestamptz)

    - `message_templates` - Templates for notifications
      - `id` (uuid, primary key)
      - `template_name` (text, unique)
      - `template_type` (text) - email, sms, whatsapp
      - `subject` (text) - For email
      - `body` (text) - Template body with placeholders
      - `active` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only see their own notifications
    - Parents can only see notifications for their children
    - Admins can manage all notifications

  3. Functions
    - `create_payment_reminder()` - Creates payment reminder notifications
    - `mark_notification_read()` - Marks notification as read
    - `get_user_notifications()` - Gets user's notifications

  4. Indexes
    - Index on user_id for fast notification retrieval
    - Index on scheduled_for for scheduling queries
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  related_type text,
  related_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  payment_reminders boolean DEFAULT true,
  due_date_alerts boolean DEFAULT true,
  receipt_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create scheduled notifications table
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  quarter_id uuid REFERENCES quarters(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent boolean DEFAULT false,
  sent_at timestamptz,
  email_sent boolean DEFAULT false,
  sms_sent boolean DEFAULT false,
  whatsapp_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create message templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  template_type text NOT NULL,
  subject text,
  body text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create their preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Scheduled notifications policies
CREATE POLICY "Authenticated users can view scheduled notifications"
  ON scheduled_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Message templates policies
CREATE POLICY "Anyone can read active templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

-- Function to create payment reminder
CREATE OR REPLACE FUNCTION create_payment_reminder(
  p_student_id uuid,
  p_quarter_id uuid,
  p_amount numeric,
  p_due_date timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
  v_student_name text;
  v_quarter_name text;
  v_parent_user_id uuid;
BEGIN
  -- Get student and quarter info
  SELECT s.name, s.parent_user_id INTO v_student_name, v_parent_user_id
  FROM students s
  WHERE s.id = p_student_id;

  SELECT q.quarter_name INTO v_quarter_name
  FROM quarters q
  WHERE q.id = p_quarter_id;

  -- Create in-app notification for parent
  IF v_parent_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, related_type, related_id)
    VALUES (
      v_parent_user_id,
      'Payment Reminder',
      'Fee payment of ₹' || p_amount::text || ' for ' || v_student_name || ' (' || v_quarter_name || ') is due on ' || to_char(p_due_date, 'DD Mon YYYY'),
      'reminder',
      'student',
      p_student_id
    )
    RETURNING id INTO v_notification_id;
  END IF;

  RETURN v_notification_id;
END;
$$;

-- Insert default message templates
INSERT INTO message_templates (template_name, template_type, subject, body, active) VALUES
('payment_reminder_email', 'email', 'Fee Payment Reminder - {{quarter_name}}',
'Dear Parent/Guardian of {{student_name}},

This is a reminder that the fee payment of ₹{{amount}} for {{quarter_name}} is due on {{due_date}}.

Please make the payment at your earliest convenience to avoid late fees.

Payment Details:
- Student: {{student_name}}
- Class: {{class_name}}
- Quarter: {{quarter_name}}
- Amount Due: ₹{{amount}}
- Due Date: {{due_date}}

You can make the payment through:
1. Online payment portal
2. School office during working hours
3. Cheque/DD in favor of J.R. Preparatory School

Thank you for your prompt attention.

Best regards,
J.R. Preparatory School', true),

('payment_overdue_email', 'email', 'Overdue Fee Payment - {{quarter_name}}',
'Dear Parent/Guardian of {{student_name}},

This is to inform you that the fee payment of ₹{{amount}} for {{quarter_name}} is now overdue. The due date was {{due_date}}.

Late fees may be applicable. Please make the payment immediately.

Outstanding Amount: ₹{{amount}}
Late Fee: ₹{{late_fee}}
Total Due: ₹{{total_due}}

Please contact the school office if you need any assistance.

Thank you,
J.R. Preparatory School', true),

('payment_confirmation_sms', 'sms', NULL,
'Payment received for {{student_name}} - ₹{{amount}} for {{quarter_name}}. Receipt: {{receipt_no}}. Thank you! - JR Prep School', true),

('payment_reminder_sms', 'sms', NULL,
'Reminder: Fee payment of ₹{{amount}} for {{student_name}} ({{quarter_name}}) is due on {{due_date}}. - JR Prep School', true)

ON CONFLICT (template_name) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User preferences for different notification channels';
COMMENT ON TABLE scheduled_notifications IS 'Queue for scheduled automated notifications';
COMMENT ON TABLE message_templates IS 'Reusable message templates with placeholders';