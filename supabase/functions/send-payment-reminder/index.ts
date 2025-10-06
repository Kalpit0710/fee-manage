import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReminderRequest {
  studentId: string;
  quarterId: string;
  type?: 'reminder' | 'overdue';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData: ReminderRequest = await req.json();
    const { studentId, quarterId, type = 'reminder' } = requestData;

    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('*, class:classes(*)')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    const { data: quarter, error: quarterError } = await supabaseClient
      .from('quarters')
      .select('*')
      .eq('id', quarterId)
      .single();

    if (quarterError || !quarter) {
      throw new Error('Quarter not found');
    }

    const { data: feeDetails } = await supabaseClient
      .from('fee_structures')
      .select('*')
      .eq('class_id', student.class_id)
      .eq('quarter_id', quarterId)
      .maybeSingle();

    const baseFee = feeDetails?.tuition_fee || 0;
    const examFee = feeDetails?.examination_fee || 0;
    const otherFee = feeDetails?.other_fee || 0;
    const totalFee = baseFee + examFee + otherFee - (student.concession_amount || 0);

    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('amount_paid')
      .eq('student_id', studentId)
      .eq('quarter_id', quarterId);

    const amountPaid = transactions?.reduce((sum, t) => sum + t.amount_paid, 0) || 0;
    const balanceDue = totalFee - amountPaid;

    if (balanceDue <= 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No balance due, reminder not sent',
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const templateName = type === 'overdue' ? 'payment_overdue_email' : 'payment_reminder_email';
    const { data: template } = await supabaseClient
      .from('message_templates')
      .select('*')
      .eq('template_name', templateName)
      .eq('active', true)
      .single();

    if (!template) {
      throw new Error('Template not found');
    }

    let emailBody = template.body
      .replace(/{{student_name}}/g, student.name)
      .replace(/{{class_name}}/g, student.class?.class_name || '')
      .replace(/{{quarter_name}}/g, quarter.quarter_name)
      .replace(/{{amount}}/g, balanceDue.toString())
      .replace(/{{due_date}}/g, new Date(quarter.due_date).toLocaleDateString('en-IN'));

    let emailSubject = template.subject
      .replace(/{{quarter_name}}/g, quarter.quarter_name);

    if (type === 'overdue') {
      const lateFee = 100;
      const totalDue = balanceDue + lateFee;
      emailBody = emailBody
        .replace(/{{late_fee}}/g, lateFee.toString())
        .replace(/{{total_due}}/g, totalDue.toString());
    }

    console.log('Sending email to:', student.parent_email);
    console.log('Subject:', emailSubject);
    console.log('Student:', student.name);
    console.log('Balance Due:', balanceDue);

    if (student.parent_user_id) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: student.parent_user_id,
          title: type === 'overdue' ? 'Overdue Payment Alert' : 'Payment Reminder',
          message: `Fee payment of ₹${balanceDue} for ${student.name} (${quarter.quarter_name}) is ${type === 'overdue' ? 'overdue' : 'due on ' + new Date(quarter.due_date).toLocaleDateString('en-IN')}`,
          type: type === 'overdue' ? 'alert' : 'reminder',
          related_type: 'student',
          related_id: studentId,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reminder sent successfully',
        recipient: student.parent_email,
        studentName: student.name,
        balanceDue: balanceDue,
        note: 'Email sending requires SMTP configuration. Notification created.',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending reminder:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});