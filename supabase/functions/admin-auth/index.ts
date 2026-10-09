import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    const url = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceRoleKey) {
      return json({ error: 'Admin passcode service is not configured.' }, 500);
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (body?.action === 'verify') {
      if (typeof body.password !== 'string' || body.password.length > 128) {
        return json({ error: 'Invalid passcode.' }, 400);
      }
      const { data, error } = await admin.rpc('verify_admin_passcode', {
        p_password: body.password,
      });
      if (error) {
        console.error('Admin passcode verification failed:', error);
        return json({ error: 'Unable to verify the admin passcode.' }, 500);
      }
      return json({ valid: data === true });
    }

    if (body?.action === 'change') {
      if (typeof body.currentPassword !== 'string' ||
          typeof body.newPassword !== 'string' ||
          body.currentPassword.length > 128 ||
          body.newPassword.length > 128) {
        return json({ error: 'Invalid passcode values.' }, 400);
      }
      if (body.newPassword.length < 12) {
        return json({ error: 'The new passcode must be at least 12 characters.' }, 400);
      }
      const { data, error } = await admin.rpc('change_admin_passcode', {
        p_current_password: body.currentPassword,
        p_new_password: body.newPassword,
      });
      if (error) {
        console.error('Admin passcode change failed:', error);
        return json({ error: 'Unable to change the admin passcode.' }, 500);
      }
      if (data !== true) {
        return json({ error: 'The current passcode is incorrect.' }, 401);
      }
      return json({ success: true });
    }

    return json({ error: 'Unsupported admin passcode action.' }, 400);
  } catch (error) {
    console.error('Admin passcode request failed:', error);
    return json({ error: 'Invalid admin passcode request.' }, 400);
  }
});
