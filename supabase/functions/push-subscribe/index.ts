import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    const role = body?.role;
    const ref = typeof body?.ref === 'string' ? body.ref.trim().toLowerCase() : '';
    const subscription = body?.subscription;
    const endpoint = subscription?.endpoint;
    if (!['user', 'admin'].includes(role) || !ref || typeof endpoint !== 'string' || !subscription?.keys) {
      return json({ error: 'Invalid push subscription.' }, 400);
    }
    if (endpoint.length > 2000) return json({ error: 'Invalid push endpoint.' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return json({ error: 'Server configuration is incomplete.' }, 500);
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await admin.from('push_subscriptions').upsert({
      role, complaint_ref: ref, endpoint, subscription, updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    if (error) {
      console.error('Push subscription save failed:', error);
      return json({ error: 'Unable to save push subscription.' }, 500);
    }
    return json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return json({ error: 'Invalid push subscription.' }, 400);
  }
});
