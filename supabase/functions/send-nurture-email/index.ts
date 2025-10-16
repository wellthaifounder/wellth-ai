import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const emailSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  estimatedSavings: z.number().min(0).max(1000000),
  calculatorData: z.object({
    healthcarePlan: z.string().max(100).optional(),
    hsaContribution: z.number().min(0).max(100000).optional(),
    paymentMethod: z.string().max(100).optional(),
    expenses: z.number().min(0).max(100000).optional(),
  }).passthrough().optional(),
  sequenceDay: z.number().int().min(0).max(10).optional().default(0),
});

interface NurtureEmailRequest {
  email: string;
  estimatedSavings: number;
  calculatorData?: any;
  sequenceDay?: number;
}

const getEmailContent = (day: number, savings: number, email: string) => {
  const emailTemplates = {
    0: {
      subject: `Your $${savings.toLocaleString()} HSA Savings Plan is Ready! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to Your HSA Journey!</h1>
          <p>Hi there,</p>
          <p>Thanks for calculating your potential HSA savings with Wellth! Based on your inputs, you could save <strong>$${savings.toLocaleString()}</strong> this year.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🎁 Limited Time Offer</h3>
            <p>Get your personalized HSA Maximizer Report for only $17 (normally $47)!</p>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/calculator" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              Claim Your Report Now
            </a>
          </div>
          
          <p>Over the next few days, I'll share:</p>
          <ul>
            <li>✅ How to maximize your HSA contributions</li>
            <li>✅ Smart strategies to reduce healthcare costs</li>
            <li>✅ Little-known HSA tax advantages</li>
          </ul>
          
          <p>Talk soon!<br>The Wellth Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            You're receiving this because you calculated your HSA savings at Wellth.
            <a href="#" style="color: #2563eb;">Unsubscribe</a>
          </p>
        </div>
      `,
    },
    1: {
      subject: "The #1 HSA Mistake That's Costing You Thousands",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Day 2: Avoid This Costly Mistake</h1>
          <p>Hi there,</p>
          <p>Yesterday we showed you could save $${savings.toLocaleString()}. But here's the truth:</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <strong>Most people leave $2,500+ on the table every year</strong> by not optimizing their HSA strategy.
          </div>
          
          <p>The biggest mistake? <strong>Not understanding the triple tax advantage.</strong></p>
          
          <p>Your HSA is the ONLY account that offers:</p>
          <ol>
            <li>Tax deduction on contributions</li>
            <li>Tax-free growth</li>
            <li>Tax-free withdrawals for medical expenses</li>
          </ol>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Want the full strategy?</strong></p>
            <p>Our HSA Maximizer Report breaks down exactly how to capture every dollar of savings.</p>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/calculator" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              Get Your Report - $17 Only
            </a>
          </div>
          
          <p>Tomorrow: I'll reveal the "stealth wealth" strategy top earners use with HSAs.</p>
          
          <p>Best,<br>The Wellth Team</p>
        </div>
      `,
    },
    2: {
      subject: "The HSA 'Stealth Wealth' Strategy (Few Know This)",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Day 3: The Secret Strategy</h1>
          <p>Hi there,</p>
          <p>Here's what the wealthy know about HSAs that you don't:</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <strong>💡 Pro Tip:</strong> Your HSA can become a stealth retirement account that beats even a Roth IRA.
          </div>
          
          <p>Here's how it works:</p>
          <ol>
            <li>Max out contributions yearly</li>
            <li>Pay medical expenses out-of-pocket (save receipts!)</li>
            <li>Invest HSA funds aggressively</li>
            <li>Let it grow tax-free for decades</li>
            <li>Reimburse yourself years later (no time limit!)</li>
          </ol>
          
          <p><strong>The result?</strong> A tax-free retirement fund that grows faster than traditional accounts.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Your personalized HSA Maximizer Report shows you exactly how to implement this strategy based on YOUR numbers.</p>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/calculator" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              Get Your Custom Strategy - $17
            </a>
            <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">⚡ Offer expires in 48 hours</p>
          </div>
          
          <p>Tomorrow: I'll share a case study of someone who saved $47,000 in just 3 years.</p>
          
          <p>Best,<br>The Wellth Team</p>
        </div>
      `,
    },
  };

  return emailTemplates[day as keyof typeof emailTemplates] || emailTemplates[0];
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = emailSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid email data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { email, estimatedSavings, calculatorData, sequenceDay } = validation.data;
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const resend = new Resend(resendApiKey);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`Sending nurture email to ${email}, day ${sequenceDay}`);

    // Store subscriber if new
    const { data: existingSubscriber } = await supabase
      .from("email_subscribers")
      .select("id")
      .eq("email", email)
      .single();

    let subscriberId = existingSubscriber?.id;

    if (!subscriberId) {
      const { data: newSubscriber, error: insertError } = await supabase
        .from("email_subscribers")
        .insert({
          email,
          estimated_savings: estimatedSavings,
          calculator_data: calculatorData,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating subscriber:", insertError);
        throw insertError;
      }

      subscriberId = newSubscriber.id;
      console.log("Created new subscriber:", subscriberId);
    }

    // Get email content for this sequence day
    const emailContent = getEmailContent(sequenceDay, estimatedSavings, email);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Wellth HSA <onboarding@resend.dev>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent:", emailResponse);

    // Track the send
    await supabase.from("email_sequence_sends").insert({
      subscriber_id: subscriberId,
      sequence_day: sequenceDay,
      email_type: `nurture_day_${sequenceDay}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        subscriberId 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-nurture-email:", error);
    return new Response(
      JSON.stringify({ error: 'Unable to send email' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
