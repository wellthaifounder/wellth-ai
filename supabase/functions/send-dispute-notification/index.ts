import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Resend from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend.Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  disputeId: string;
  notificationType: 'submitted' | 'deadline_approaching' | 'settlement_offer' | 'status_update' | 'resolution';
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { disputeId, notificationType, email: providedEmail }: NotificationRequest = await req.json();

    console.log(`Processing ${notificationType} notification for dispute ${disputeId}`);

    // Fetch dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('bill_disputes')
      .select('*, profiles!inner(full_name)')
      .eq('id', disputeId)
      .single();

    if (disputeError || !dispute) {
      throw new Error(`Failed to fetch dispute: ${disputeError?.message}`);
    }

    // Get user email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(dispute.user_id);
    if (userError || !user?.email) {
      throw new Error(`Failed to fetch user email: ${userError?.message}`);
    }

    const userEmail = providedEmail || user.email;
    const userName = dispute.profiles?.full_name || 'there';

    // Generate email content based on notification type
    let subject = '';
    let html = '';

    switch (notificationType) {
      case 'submitted':
        subject = `✅ Dispute Submitted - ${dispute.provider_name}`;
        html = `
          <h2>Your dispute has been submitted successfully!</h2>
          <p>Hi ${userName},</p>
          <p>We've successfully submitted your dispute for <strong>${dispute.provider_name}</strong>.</p>
          <p><strong>Dispute Details:</strong></p>
          <ul>
            <li>Original Amount: $${dispute.original_amount?.toLocaleString()}</li>
            <li>Disputed Amount: $${dispute.disputed_amount?.toLocaleString()}</li>
            <li>Response Deadline: ${dispute.response_deadline ? new Date(dispute.response_deadline).toLocaleDateString() : 'Not set'}</li>
          </ul>
          <p>We'll notify you when there are updates or when the deadline approaches.</p>
          <p>Best regards,<br>The Wellth Team</p>
        `;
        break;

      case 'deadline_approaching':
        const daysUntilDeadline = dispute.response_deadline 
          ? Math.ceil((new Date(dispute.response_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0;
        subject = `⏰ Dispute Deadline Approaching - ${dispute.provider_name}`;
        html = `
          <h2>Your dispute deadline is approaching</h2>
          <p>Hi ${userName},</p>
          <p>This is a reminder that your dispute with <strong>${dispute.provider_name}</strong> has a response deadline in <strong>${daysUntilDeadline} days</strong>.</p>
          <p><strong>Deadline:</strong> ${dispute.response_deadline ? new Date(dispute.response_deadline).toLocaleDateString() : 'Not set'}</p>
          <p>If you haven't received a response, consider following up with the provider.</p>
          <p>Best regards,<br>The Wellth Team</p>
        `;
        break;

      case 'settlement_offer':
        subject = `💰 Settlement Offer Received - ${dispute.provider_name}`;
        html = `
          <h2>You have a new settlement offer</h2>
          <p>Hi ${userName},</p>
          <p>A settlement offer has been recorded for your dispute with <strong>${dispute.provider_name}</strong>.</p>
          <p>Log in to your account to review the offer and decide on your next steps.</p>
          <p>Best regards,<br>The Wellth Team</p>
        `;
        break;

      case 'status_update':
        subject = `📋 Dispute Status Update - ${dispute.provider_name}`;
        html = `
          <h2>Your dispute status has been updated</h2>
          <p>Hi ${userName},</p>
          <p>There's been an update to your dispute with <strong>${dispute.provider_name}</strong>.</p>
          <p><strong>Current Status:</strong> ${dispute.dispute_status.replace(/_/g, ' ').toUpperCase()}</p>
          <p>Log in to your account to view the full details.</p>
          <p>Best regards,<br>The Wellth Team</p>
        `;
        break;

      case 'resolution':
        const savings = dispute.savings_achieved || 0;
        subject = savings > 0 
          ? `🎉 Dispute Resolved - You Saved $${savings.toLocaleString()}!`
          : `✓ Dispute Resolved - ${dispute.provider_name}`;
        html = `
          <h2>Your dispute has been resolved</h2>
          <p>Hi ${userName},</p>
          <p>Your dispute with <strong>${dispute.provider_name}</strong> has been resolved.</p>
          ${savings > 0 ? `<p><strong>🎉 Congratulations! You saved $${savings.toLocaleString()}!</strong></p>` : ''}
          <p><strong>Final Details:</strong></p>
          <ul>
            <li>Original Amount: $${dispute.original_amount?.toLocaleString()}</li>
            <li>Final Amount: $${dispute.resolved_amount?.toLocaleString() || dispute.disputed_amount?.toLocaleString()}</li>
            ${savings > 0 ? `<li>Total Savings: $${savings.toLocaleString()}</li>` : ''}
          </ul>
          <p>Thank you for using Wellth to manage your medical bills!</p>
          <p>Best regards,<br>The Wellth Team</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Wellth <onboarding@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-dispute-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
