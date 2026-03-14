import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Fetch Order
    const { data: order, error: fetchError } = await supabaseClient
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 2. Check if invoice exists
    if (order.invoice) {
      return new Response(JSON.stringify({ success: true, invoice: order.invoice }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Generate New Invoice Number
    const { count } = await supabaseClient
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .not('invoice', 'is', null);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${((count || 0) + 1)
      .toString()
      .padStart(4, "0")}`;

    const invoiceObj = {
      invoiceNumber,
      issueDate: new Date().toISOString(),
      totalAmount: order.total_price,
    };

    // 4. Update Order
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ invoice: invoiceObj })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, invoice: invoiceObj }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
