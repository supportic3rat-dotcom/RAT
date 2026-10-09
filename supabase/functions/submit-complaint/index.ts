import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const cleanPayload = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(input)) {
    if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(key)) continue;
    if (typeof raw === 'string') {
      output[key] = raw.trim().slice(0, 10000);
    } else if (typeof raw === 'boolean' || typeof raw === 'number' || raw === null) {
      output[key] = raw;
    } else if (Array.isArray(raw)) {
      output[key] = raw.slice(0, 100).map((item) => String(item).slice(0, 10000));
    }
  }

  return output;
};

const makeReference = () => {
  const random = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `IC-2026-${random}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const payload = cleanPayload(body?.payload);

    if (!payload.digitalSignature || payload.digitalSignature.length < 2) {
      return json({ error: 'A digital signature is required.' }, 400);
    }

    if (payload.affirmCheck !== 'on' && payload.affirmCheck !== 'true' && payload.affirmCheck !== true) {
      return json({ error: 'The legal affirmation is required.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Supabase server configuration is incomplete.' }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const referenceNumber = makeReference();
    const { data, error } = await admin
      .from('complaints')
      .insert({
        reference_number: referenceNumber,
        status: 'submitted',
        payload,
      })
      .select('id, reference_number, status, submitted_at')
      .single();

    if (error) {
      console.error('Complaint insert failed:', error);
      return json({ error: 'Unable to save the complaint.' }, 500);
    }

    return json({ success: true, complaint: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ error: 'Invalid submission.' }, 400);
  }
});
