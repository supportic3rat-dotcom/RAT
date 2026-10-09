import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

const isValidReference = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 200 &&
  /^[a-z0-9._@+-]+$/i.test(value);

async function listAttachmentPaths(
  admin: SupabaseClient,
  folder: string,
): Promise<string[]> {
  const paths: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from('chat-media').list(folder, { limit: 1000, offset });
    if (error) throw error;
    const items = data || [];
    for (const item of items) {
      const path = `${folder}/${item.name}`;
      if (item.id) {
        paths.push(path);
      } else {
        paths.push(...await listAttachmentPaths(admin, path));
      }
    }
    if (items.length < 1000) break;
  }
  return paths;
}

async function removeChatAttachments(admin: SupabaseClient, complaintRef: string): Promise<void> {
  const paths = await listAttachmentPaths(admin, complaintRef);
  for (let offset = 0; offset < paths.length; offset += 1000) {
    const { error } = await admin.storage.from('chat-media').remove(paths.slice(offset, offset + 1000));
    if (error) throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    if (typeof body?.password !== 'string' || body.password.length > 128) {
      return json({ error: 'The admin passcode is required.' }, 401);
    }
    const url = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceRoleKey) {
      return json({ error: 'Admin moderation service is not configured.' }, 500);
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: validPasscode, error: verifyError } = await admin.rpc('verify_admin_passcode', {
      p_password: body.password,
    });
    if (verifyError) {
      console.error('Admin passcode verification failed:', verifyError);
      return json({ error: 'Unable to verify the admin passcode.' }, 500);
    }
    if (validPasscode !== true) return json({ error: 'The admin passcode is incorrect.' }, 401);

    if (body.action === 'delete-report') {
      if (typeof body.reporterId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.reporterId)) {
        return json({ error: 'Invalid report ID.' }, 400);
      }
      if (!isValidReference(body.complaintRef)) {
        return json({ error: 'Invalid complaint reference.' }, 400);
      }

      const { data: report, error: reportError } = await admin
        .from('complaints')
        .select('id,reference_number,tracking_id,matter_id,email,payload')
        .eq('id', body.reporterId)
        .maybeSingle();
      if (reportError) {
        console.error('Report lookup before deletion failed:', reportError);
        return json({ error: 'Unable to find the selected report.' }, 500);
      }
      if (!report) return json({ error: 'The selected report no longer exists.' }, 404);

      const payload = report.payload && typeof report.payload === 'object' && !Array.isArray(report.payload)
        ? report.payload as Record<string, unknown>
        : {};
      const refs = [...new Set([
        body.complaintRef,
        report.tracking_id,
        report.matter_id,
        report.reference_number,
        payload.trackingId,
        payload.matterId,
      ].filter(isValidReference).map((ref) => ref.toLowerCase()))];

      try {
        for (const ref of refs) await removeChatAttachments(admin, ref);
      } catch (error) {
        console.error('Report attachment deletion failed:', error);
        return json({ error: 'Unable to remove the report’s chat attachments. The report was not deleted.' }, 500);
      }

      const { error: messagesError } = await admin.from('chat_messages').delete().in('complaint_ref', refs);
      if (messagesError) {
        console.error('Report chat deletion failed:', messagesError);
        return json({ error: 'Chat attachments were removed, but the report and chat records could not be deleted.' }, 500);
      }

      const { error: blockedError } = await admin.from('admin_blocked_chats').delete().in('complaint_ref', refs);
      if (blockedError) {
        console.error('Report block record cleanup failed:', blockedError);
        return json({ error: 'Chat history was removed, but report cleanup could not be completed.' }, 500);
      }

      const { error: subscriptionsError } = await admin.from('push_subscriptions').delete().in('complaint_ref', refs);
      if (subscriptionsError) {
        console.error('Report push subscription cleanup failed:', subscriptionsError);
        return json({ error: 'Chat history was removed, but report cleanup could not be completed.' }, 500);
      }

      const { data: deletedReport, error: deleteError } = await admin
        .from('complaints')
        .delete()
        .eq('id', report.id)
        .select('id')
        .maybeSingle();
      if (deleteError) {
        console.error('Report deletion failed:', deleteError);
        return json({ error: 'Related chat data was removed, but the report could not be deleted.' }, 500);
      }
      if (!deletedReport) return json({ error: 'The selected report was not deleted.' }, 404);
      return json({ success: true, refs });
    }

    if (!isValidReference(body?.complaintRef)) {
      return json({ error: 'Invalid complaint reference.' }, 400);
    }
    const complaintRef = body.complaintRef.toLowerCase();
    if (body.action === 'status') {
      const { data, error } = await admin
        .from('admin_blocked_chats')
        .select('complaint_ref')
        .eq('complaint_ref', complaintRef)
        .maybeSingle();
      if (error) {
        console.error('Chat block status lookup failed:', error);
        return json({ error: 'Unable to check chat status.' }, 500);
      }
      return json({ blocked: !!data });
    }

    if (body.action === 'block') {
      const { error } = await admin.from('admin_blocked_chats').upsert({
        complaint_ref: complaintRef,
        blocked_at: new Date().toISOString(),
      }, { onConflict: 'complaint_ref' });
      if (error) {
        console.error('Chat block failed:', error);
        return json({ error: 'Unable to block this chat.' }, 500);
      }
      return json({ blocked: true });
    }

    if (body.action === 'unblock') {
      const { error } = await admin
        .from('admin_blocked_chats')
        .delete()
        .eq('complaint_ref', complaintRef);
      if (error) {
        console.error('Chat unblock failed:', error);
        return json({ error: 'Unable to unblock this chat.' }, 500);
      }
      return json({ blocked: false });
    }

    if (body.action === 'send-message') {
      if (typeof body.message !== 'string' || body.message.trim().length < 1 ||
          body.message.length > 4000) {
        return json({ error: 'Messages must contain 1 to 4000 characters.' }, 400);
      }
      const attachment = body.attachment;
      if (attachment !== null && attachment !== undefined &&
          (typeof attachment !== 'object' ||
           typeof attachment.url !== 'string' ||
           typeof attachment.name !== 'string' ||
           typeof attachment.type !== 'string' ||
           !attachment.url.startsWith(`${url.replace(/\/$/, '')}/storage/v1/object/public/chat-media/${complaintRef}/`) ||
           attachment.name.length > 255 ||
           attachment.type.length > 150)) {
        return json({ error: 'Invalid chat attachment.' }, 400);
      }

      const { error } = await admin.from('chat_messages').insert({
        complaint_ref: complaintRef,
        sender: 'admin',
        sender_name: 'RAT Operations Desk',
        message: body.message.trim(),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
      });
      if (error) {
        console.error('Admin message send failed:', error);
        return json({ error: 'Unable to send the admin message.' }, 500);
      }

      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      if (anonKey) {
        try {
          const pushResponse = await fetch(`${url.replace(/\/$/, '')}/functions/v1/push-notify`, {
            method: 'POST',
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ref: complaintRef,
              role: 'user',
              title: 'Message from your case officer',
              body: body.message.trim().slice(0, 140),
              url: '/dashboard.html',
            }),
          });
          if (!pushResponse.ok) console.warn('Admin message push notification failed:', pushResponse.status);
        } catch (error) {
          console.warn('Admin message push notification failed:', error);
        }
      }
      return json({ success: true });
    }

    if (body.action === 'delete-chat') {
      try {
        await removeChatAttachments(admin, complaintRef);
      } catch (error) {
        console.error('Chat attachment listing failed:', error);
        return json({ error: 'Unable to list chat attachments; no chat data was deleted.' }, 500);
      }

      const { error } = await admin
        .from('chat_messages')
        .delete()
        .eq('complaint_ref', complaintRef);
      if (error) {
        console.error('Chat history deletion failed:', error);
        return json({ error: 'Attachments were removed, but chat messages could not be deleted.' }, 500);
      }
      return json({ success: true });
    }

    return json({ error: 'Unsupported moderation action.' }, 400);
  } catch (error) {
    console.error('Admin moderation request failed:', error);
    return json({ error: 'Invalid admin moderation request.' }, 400);
  }
});
