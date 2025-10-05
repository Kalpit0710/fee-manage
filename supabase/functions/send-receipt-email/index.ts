import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReceiptEmailRequest {
  to: string;
  studentName: string;
  receiptNo: string;
  amount: number;
  paymentDate: string;
  quarter: string;
  paymentMode: string;
  breakdown: {
    baseFee: number;
    extraCharges: number;
    lateFee: number;
    concession: number;
    total: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestData: ReceiptEmailRequest = await req.json();

    const emailHtml = generateReceiptEmail(requestData);

    const emailSubject = `Fee Payment Receipt - ${requestData.receiptNo}`;

    console.log("Email would be sent to:", requestData.to);
    console.log("Subject:", emailSubject);
    console.log("Receipt No:", requestData.receiptNo);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Receipt email prepared successfully",
        recipient: requestData.to,
        receiptNo: requestData.receiptNo,
        note: "Email sending requires SMTP configuration. Email content has been generated."
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing receipt email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});

function generateReceiptEmail(data: ReceiptEmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fee Payment Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px; }
        .receipt-info { background: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .breakdown { margin: 20px 0; }
        .breakdown h3 { margin: 0 0 15px; color: #111827; font-size: 16px; }
        .breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; }
        .total { border-top: 2px solid #2563eb; padding-top: 12px; margin-top: 12px; font-size: 18px; font-weight: bold; color: #2563eb; }
        .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>J.R. Preparatory School</h1>
          <p>Puranpur, Uttar Pradesh - 262122</p>
        </div>

        <div class="content">
          <h2 style="color: #111827; margin-top: 0;">Fee Payment Receipt</h2>
          <p>Dear Parent/Guardian of <strong>${data.studentName}</strong>,</p>
          <p>Thank you for your payment. Here are the details of your recent fee payment:</p>

          <div class="receipt-info">
            <div class="info-row">
              <span class="label">Receipt Number:</span>
              <span class="value">${data.receiptNo}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Date:</span>
              <span class="value">${new Date(data.paymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-row">
              <span class="label">Quarter:</span>
              <span class="value">${data.quarter}</span>
            </div>
            <div class="info-row">
              <span class="label">Payment Mode:</span>
              <span class="value">${data.paymentMode.toUpperCase()}</span>
            </div>
          </div>

          <div class="breakdown">
            <h3>Fee Breakdown</h3>
            <div class="breakdown-item">
              <span>Base Fee:</span>
              <span>₹${data.breakdown.baseFee.toLocaleString('en-IN')}</span>
            </div>
            ${data.breakdown.extraCharges > 0 ? `
            <div class="breakdown-item">
              <span>Extra Charges:</span>
              <span>₹${data.breakdown.extraCharges.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            ${data.breakdown.lateFee > 0 ? `
            <div class="breakdown-item" style="color: #dc2626;">
              <span>Late Fee:</span>
              <span>₹${data.breakdown.lateFee.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            ${data.breakdown.concession > 0 ? `
            <div class="breakdown-item" style="color: #16a34a;">
              <span>Concession:</span>
              <span>-₹${data.breakdown.concession.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            <div class="breakdown-item total">
              <span>Total Paid:</span>
              <span>₹${data.breakdown.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div class="alert">
            <strong>Note:</strong> This is a computer-generated receipt. Please keep this for your records. If you have any questions, please contact the school office.
          </div>
        </div>

        <div class="footer">
          <p>J.R. Preparatory School, Puranpur, Uttar Pradesh - 262122</p>
          <p>Phone: +91 98765 43210 | Email: office@jrprep.edu</p>
          <p>&copy; ${new Date().getFullYear()} J.R. Preparatory School. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}