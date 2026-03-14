import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { reportType, dateFrom, dateTo } = await req.json();

    if (reportType === 'orders') {
      let query = supabaseClient
        .from('orders')
        .select(`
          id,
          total_price,
          status,
          created_at,
          customers (shop_name)
        `)
        .order('created_at', { ascending: false });

      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);

      const { data, error } = await query;
      if (error) throw error;

      // Generate CSV
      const headers = ['Order ID', 'Date', 'Shop Name', 'Total Price', 'Status'];
      const rows = (data || []).map(order => [
        order.id,
        new Date(order.created_at).toLocaleDateString(),
        order.customers?.shop_name || 'Unknown',
        order.total_price,
        order.status
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

      return new Response(csvContent, {
        headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="orders_report.csv"'
        },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid report type' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
