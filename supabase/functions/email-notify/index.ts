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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const eventType = body?.eventType || 'notification';
    const payload = body?.payload || body?.data || body;
    const toEmail = Deno.env.get('NOTIFICATION_EMAIL') || 'support.ic3rat@gmail.com';
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // If RESEND_API_KEY is configured in Supabase secrets, send via Resend API
    if (resendApiKey) {
      const subject = payload?._subject || `[IC3 RAT] Notification: ${eventType}`;
      const fieldsHtml = Object.entries(payload)
        .filter(([k]) => !k.startsWith('_'))
        .map(([k, v]) => `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">${k}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${String(v)}</td></tr>`)
        .join('');

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;">
          <h2 style="color:#d9381e;margin-bottom:16px;">IC3 Recovery Asset Team — Notification</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            ${fieldsHtml}
          </table>
          <p style="font-size:12px;color:#6b7280;margin-top:20px;">Sent automatically by the IC3 RAT notification system.</p>
        </div>
      `;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM') || 'IC3 RAT Portal <onboarding@resend.dev>',
          to: [toEmail],
          subject: subject,
          html: html,
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        console.error('Resend delivery failed:', errorText);
        return json({ error: 'Failed to send via Resend', details: errorText }, 500);
      }

      return json({ success: true, provider: 'resend' });
    }

    // Default: Dispatch via FormSubmit endpoint to support.ic3rat@gmail.com
    const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        _subject: payload?._subject || `[IC3 RAT] Notification: ${eventType}`,
        _template: 'table',
        _captcha: 'false',
        ...payload,
      }),
    });

    if (!formSubmitRes.ok) {
      const errorText = await formSubmitRes.text();
      console.warn('FormSubmit delivery failed:', errorText);
      return json({ error: 'FormSubmit failed', details: errorText }, 500);
    }

    return json({ success: true, provider: 'formsubmit' });
  } catch (error) {
    console.error('Email notification error:', error);
    return json({ error: 'Invalid notification request' }, 400);
  }
});
