import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BulkReminderRequest {
  quarterId?: string;
  classId?: string;
  defaultersOnly?: boolean;
  reminderType?: 'reminder' | 'overdue';
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

    const requestData: BulkReminderRequest = await req.json();
    const { quarterId, classId, defaultersOnly = true, reminderType = 'reminder' } = requestData;

    let query = supabaseClient
      .from('students')
      .select('id, name, parent_email, parent_user_id, class:classes(class_name)');

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data: students, error: studentsError } = await query;

    if (studentsError || !students) {
      throw new Error('Failed to fetch students');
    }

    let quarter;
    if (quarterId) {
      const { data: quarterData, error: quarterError } = await supabaseClient
        .from('quarters')
        .select('*')
        .eq('id', quarterId)
        .single();

      if (quarterError || !quarterData) {
        throw new Error('Quarter not found');
      }
      quarter = quarterData;
    } else {
      const { data: activeQuarters } = await supabaseClient
        .from('quarters')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(1);

      if (!activeQuarters || activeQuarters.length === 0) {
        throw new Error('No active quarter found');
      }
      quarter = activeQuarters[0];
    }

    const results = {
      total: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const student of students) {
      results.total++;

      try {
        const { data: feeDetails } = await supabaseClient
          .from('fee_structures')
          .select('*')
          .eq('class_id', student.class_id)
          .eq('quarter_id', quarter.id)
          .maybeSingle();

        const totalFee = (feeDetails?.tuition_fee || 0) +
                        (feeDetails?.examination_fee || 0) +
                        (feeDetails?.other_fee || 0);

        const { data: transactions } = await supabaseClient
          .from('transactions')
          .select('amount_paid')
          .eq('student_id', student.id)
          .eq('quarter_id', quarter.id);

        const amountPaid = transactions?.reduce((sum, t) => sum + t.amount_paid, 0) || 0;
        const balanceDue = totalFee - amountPaid;

        if (defaultersOnly && balanceDue <= 0) {
          results.skipped++;
          results.details.push({
            student: student.name,
            status: 'skipped',
            reason: 'No balance due'
          });
          continue;
        }

        if (balanceDue <= 0) {
          results.skipped++;
          continue;
        }

        if (student.parent_user_id) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: student.parent_user_id,
              title: reminderType === 'overdue' ? 'Overdue Payment Alert' : 'Payment Reminder',
              message: `Fee payment of ₹${balanceDue} for ${student.name} (${quarter.quarter_name}) is ${reminderType === 'overdue' ? 'overdue' : 'due on ' + new Date(quarter.due_date).toLocaleDateString('en-IN')}`,
              type: reminderType === 'overdue' ? 'alert' : 'reminder',
              related_type: 'student',
              related_id: student.id,
            });

          results.sent++;
          results.details.push({
            student: student.name,
            status: 'sent',
            balanceDue: balanceDue,
            email: student.parent_email
          });
        } else {
          results.skipped++;
          results.details.push({
            student: student.name,
            status: 'skipped',
            reason: 'No parent user account'
          });
        }

      } catch (error) {
        results.errors++;
        results.details.push({
          student: student.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk reminders processed: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`,
        results: results,
        quarter: quarter.quarter_name,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending bulk reminders:", error);

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