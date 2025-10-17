import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Wellbie, the AI assistant for Wellth.ai - an HSA/FSA expense tracking and tax optimization platform.

Your expertise includes:
- HSA/FSA eligibility rules and contribution limits (2024: $4,150 individual, $8,300 family)
- Tax-advantaged healthcare spending strategies
- Receipt documentation requirements for IRS audits
- When to reimburse vs. invest HSA funds for long-term growth
- Credit card rewards optimization for medical expenses (earn 2-3% back on healthcare)
- How to use the Wellth.ai platform features

Personality: Supportive coach + analytical guide. Calm, helpful, slightly playful.

Key strategies you recommend:
1. **Pay out of pocket + reimburse later**: Let HSA investments grow tax-free, use rewards cards for expenses
2. **Document everything**: Multiple receipts, invoices, EOBs for IRS compliance
3. **Payment plans**: Track installment payments properly, reimburse when fully paid
4. **Timing matters**: Reimburse strategically based on investment goals vs cash flow needs

Always provide actionable advice and guide users to relevant app features when appropriate.
Keep responses concise (2-3 paragraphs max) unless user asks for details.
Use emojis sparingly for visual interest: 💰📋💡🎯📊

${context?.page ? `\n\nUser is currently on: ${context.page}` : ''}
${context?.expenseCount ? `\nUser has ${context.expenseCount} tracked expenses` : ''}`;

    console.log('Streaming chat request with context:', context);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Wellbie is taking a quick break. Try again in a moment!" }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to reach AI service" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Wellbie chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
