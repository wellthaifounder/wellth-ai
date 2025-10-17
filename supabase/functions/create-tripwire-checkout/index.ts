import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const checkoutSchema = z.object({
  estimatedSavings: z.number().min(0).max(1000000),
  calculatorData: z.object({
    healthcarePlan: z.string().max(100),
    hsaContribution: z.number().min(0).max(100000),
    paymentMethod: z.string().max(100),
    expenses: z.number().min(0).max(100000),
  }).passthrough(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { estimatedSavings, calculatorData } = validation.data;
    
    console.log('Creating checkout session for savings:', estimatedSavings);
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1SHqtu2Oq7FyVuCtDeoE6FUX',
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${req.headers.get('origin')}/tripwire-success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        type: 'tripwire',
        estimatedSavings: estimatedSavings.toString(),
        calculatorData: JSON.stringify(calculatorData),
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ 
        clientSecret: session.client_secret,
        sessionId: session.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to create checkout session' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
