import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    const ref = typeof body?.ref === 'string' ? body.ref.trim().toLowerCase() : '';
    const role = body?.role === 'admin' ? 'admin' : 'user';
    if (!ref || !body?.title || !body?.body) return json({ error: 'Invalid notification.' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';
    if (!url || !serviceKey || !vapidPublic || !vapidPrivate) return json({ error: 'Push server configuration is incomplete.' }, 500);
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: allRows, error } = await admin.from('push_subscriptions').select('id,complaint_ref,subscription').eq('role', role);
    if (error) return json({ error: 'Unable to load push subscriptions.' }, 500);
    const rows = (allRows || []).filter((row) => row.complaint_ref === ref || (role === 'admin' && row.complaint_ref === '*'));
    const payload = JSON.stringify({ title: body.title, body: body.body, url: body.url || (role === 'admin' ? '/admin.html' : '/dashboard.html'), tag: body.tag || 'ic3-rat-update' });
    await Promise.all((rows || []).map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
      } catch (pushError) {
        if (pushError?.statusCode === 404 || pushError?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', row.id);
        } else {
          console.error('Push delivery failed:', pushError);
        }
      }
    }));
    return json({ success: true });
  } catch (error) {
    console.error('Push notification error:', error);
    return json({ error: 'Unable to send notification.' }, 500);
  }
});
