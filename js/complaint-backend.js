/**
 * IC3 RAT — Supabase Backend API
 * Single source of truth: all data lives in Supabase, not localStorage.
 * Tables: complaints, chat_messages
 */
(function () {
  'use strict';

  function cfg() { return window.SUPABASE_CONFIG || {}; }
  function base() { return (cfg().url || '').replace(/\/$/, ''); }
  function key()  { return cfg().anonKey || ''; }

  function ready() {
    return !!(cfg().url && cfg().anonKey &&
      !cfg().url.includes('YOUR_PROJECT') &&
      !cfg().anonKey.includes('YOUR_SUPABASE'));
  }

  function headers(extra) {
    var h = {
      'apikey': key(),
      'Authorization': 'Bearer ' + key(),
      'Content-Type': 'application/json'
    };
    return Object.assign(h, extra || {});
  }

  async function post(path, body, extra) {
    var r = await fetch(base() + path, {
      method: 'POST',
      headers: headers(extra),
      body: JSON.stringify(body)
    });
    if (!r.ok) { var t = await r.text(); console.error('[IC3 API] POST error:', t); return null; }
    var json = await r.json();
    return Array.isArray(json) && json.length ? json[0] : json;
  }

  async function get(path) {
    var r = await fetch(base() + path, { method: 'GET', headers: headers() });
    if (!r.ok) { console.error('[IC3 API] GET error:', r.status, path); return null; }
    return await r.json();
  }

  async function patch(path, body) {
    var r = await fetch(base() + path, {
      method: 'PATCH',
      headers: headers({ 'Prefer': 'return=representation' }),
      body: JSON.stringify(body)
    });
    if (!r.ok) { var t = await r.text(); console.error('[IC3 API] PATCH error:', t); return null; }
    var json = await r.json();
    return Array.isArray(json) ? (json.length ? json[0] : null) : json;
  }

  function notifyPush(ref, role, title, body, url) {
    if (!ready() || !ref) return;
    fetch(base() + '/functions/v1/push-notify', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ ref: String(ref).toLowerCase(), role: role, title: title, body: body, url: url })
    }).then(function (response) {
      if (!response.ok) console.warn('[IC3 API] Push notification request failed:', response.status);
    }).catch(function (error) {
      console.warn('[IC3 API] Push notification request failed:', error);
    });
  }

  // ─── COMPLAINTS ────────────────────────────────────────────────────────────

  /**
   * Save a new complaint to Supabase.
   * Called by complaint.html after form submission.
   */
  async function submitComplaint(data) {
    if (!ready()) { console.warn('[IC3 API] Supabase not configured'); return null; }
    var row = {
      reference_number: data.trackingId || ('IC-' + Date.now()),
      email:            (data.email || '').toLowerCase().trim(),
      name:             data.name || '',
      tracking_id:      data.trackingId || '',
      matter_id:        data.matterId || '',
      password_plain:   data.password || '',
      phone:            data.phone || '',
      country:          data.country || '',
      scam_type:        data.scamType || data.txType || '',
      loss_amount:      data.lossAmount || data.moneyLost || '',
      case_status:      'Under Review',
      pipeline_stage:   0,
      docket_entries:   [],
      status:           'submitted',
      payload:          data
    };
    return await post('/rest/v1/complaints', row, { 'Prefer': 'return=representation' });
  }

  /**
   * Authenticate a user by email (or tracking/matter ID) + password.
   * Returns the complaint row or null if not found / wrong password.
   */
  async function loginUser(identifier, password) {
    if (!ready() || !identifier) return null;
    var q = identifier.trim().toLowerCase();

    // Try matching on email, tracking_id, or matter_id
    var rows = await get(
      '/rest/v1/complaints?select=*' +
      '&or=(email.ilike.' + encodeURIComponent(q) +
      ',tracking_id.ilike.' + encodeURIComponent(q) +
      ',matter_id.ilike.' + encodeURIComponent(q) + ')' +
      '&order=submitted_at.desc&limit=1'
    );
    if (!rows || !rows.length) return null;
    var row = rows[0];

    // Check password
    if (row.password_plain && row.password_plain !== password) {
      return { __wrongPassword: true };
    }

    return _normalise(row);
  }

  /**
   * Fetch a single user's complaint data (by email, tracking ID, or matter ID).
   * Returns normalised user object or null.
   */
  async function getUserRecord(identifier) {
    if (!ready() || !identifier) return null;
    var q = identifier.trim().toLowerCase();
    var rows = await get(
      '/rest/v1/complaints?select=*' +
      '&or=(email.ilike.' + encodeURIComponent(q) +
      ',tracking_id.ilike.' + encodeURIComponent(q) +
      ',matter_id.ilike.' + encodeURIComponent(q) + ')' +
      '&order=submitted_at.desc&limit=1'
    );
    if (!rows || !rows.length) return null;
    return _normalise(rows[0]);
  }

  /**
   * Fetch ALL complaints (for admin dashboard).
   */
  async function getAllComplaints() {
    if (!ready()) return [];
    var rows = await get('/rest/v1/complaints?select=*&order=submitted_at.desc');
    if (!Array.isArray(rows)) return [];
    return rows.map(_normalise);
  }

  /**
   * Admin: update case status, pipeline stage, docket, and/or recovery figures.
   */
  async function updateComplaint(trackingId, updates) {
    if (!ready() || !trackingId) return null;
    var patch_body = {};
    if (updates.caseStatus    !== undefined) patch_body.case_status    = updates.caseStatus;
    if (updates.pipelineStage !== undefined) patch_body.pipeline_stage = updates.pipelineStage;
    if (updates.docketEntries !== undefined) patch_body.docket_entries = updates.docketEntries;

    var mergeRecovery = updates.recoveredAmount !== undefined
      || updates.recoveryProgress !== undefined
      || updates.clearedAmount !== undefined;
    if (mergeRecovery) {
      var rows = await get(
        '/rest/v1/complaints?select=payload&tracking_id=eq.' + encodeURIComponent(trackingId) + '&limit=1'
      );
      var p = {};
      if (Array.isArray(rows) && rows[0] && rows[0].payload) p = rows[0].payload;
      if (typeof p === 'string') {
        try { p = JSON.parse(p) || {}; } catch (e) { p = {}; }
      }
      if (!p || typeof p !== 'object' || Array.isArray(p)) p = {};
      if (updates.recoveredAmount !== undefined) p.recoveredAmount = updates.recoveredAmount;
      if (updates.recoveryProgress !== undefined) p.recoveryProgress = updates.recoveryProgress;
      if (updates.clearedAmount !== undefined) p.clearedAmount = updates.clearedAmount;
      patch_body.payload = p;
    }

    if (!Object.keys(patch_body).length) return null;
    var result = await patch(
      '/rest/v1/complaints?tracking_id=eq.' + encodeURIComponent(trackingId),
      patch_body
    );
    if (result === null || result === undefined) {
      throw new Error('The complaint update was not accepted by Supabase.');
    }
    notifyPush(trackingId, 'user', 'Your case was updated', 'Your case officer updated your case record.', '/dashboard.html');
    return result;
  }

  /**
   * Admin: create a new client record directly from the admin dashboard.
   */
  async function createClient(data) {
    return await submitComplaint(data);
  }

  // ─── CHAT ──────────────────────────────────────────────────────────────────

  /**
   * Send a chat message. complaintRef = tracking_id of the case.
   * sender = 'user' | 'admin'
   */
  async function sendMessage(complaintRef, sender, senderName, message, attachment) {
    if (!ready() || !complaintRef || (!message && !attachment)) return null;
    if (sender === 'user' && await isChatBlocked(complaintRef)) {
      throw new Error('This chat has been blocked by an administrator. You cannot send messages.');
    }
    var row = {
      complaint_ref: complaintRef.toLowerCase(),
      sender:        sender,
      sender_name:   senderName || (sender === 'admin' ? 'RAT Operations Desk' : 'Client'),
      message:       message || (attachment ? 'Attachment' : ''),
      attachment_url: attachment && attachment.url || null,
      attachment_name: attachment && attachment.name || null,
      attachment_type: attachment && attachment.type || null
    };
    var result = await post('/rest/v1/chat_messages', row, { 'Prefer': 'return=representation' });
    if (!result) throw new Error('Message was not accepted. Check your connection and try again.');
    if (result) {
      notifyPush(complaintRef, sender === 'admin' ? 'user' : 'admin',
        sender === 'admin' ? 'Message from your case officer' : 'New client message',
        message.slice(0, 140), sender === 'admin' ? '/dashboard.html' : '/admin.html');
    }
    return result;
  }

  async function uploadChatAttachment(file, complaintRef) {
    if (!ready() || !file || !complaintRef) return null;
    if (await isChatBlocked(complaintRef)) {
      throw new Error('This chat has been blocked by an administrator. You cannot send messages.');
    }
    if (file.size >= 5 * 1024 * 1024) throw new Error('Attachments must be smaller than 5 MB.');
    var safeName = String(file.name || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
    var path = String(complaintRef).toLowerCase() + '/' + Date.now() + '-' + safeName;
    var response = await fetch(base() + '/storage/v1/object/chat-media/' + path, {
      method: 'POST',
      headers: headers({ 'x-upsert': 'false', 'Content-Type': file.type || 'application/octet-stream' }),
      body: file
    });
    if (!response.ok) {
      var text = await response.text();
      console.error('[IC3 API] Attachment upload error:', text);
      throw new Error('The attachment could not be uploaded.');
    }
    return {
      url: base() + '/storage/v1/object/public/chat-media/' + path,
      name: file.name,
      type: file.type || 'application/octet-stream'
    };
  }

  async function isChatBlocked(complaintRef) {
    var r = await fetch(base() + '/rest/v1/rpc/is_admin_chat_blocked', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ p_complaint_ref: String(complaintRef).toLowerCase() })
    });
    if (!r.ok) {
      var text = await r.text();
      console.error('[IC3 API] Chat block check error:', text);
      throw new Error('Unable to check chat permissions. Please try again.');
    }
    return (await r.json()) === true;
  }

  /**
   * Fetch all chat messages for a complaint, oldest first.
   */
  async function getMessages(complaintRef) {
    if (!ready() || !complaintRef) return [];
    var rows = await get(
      '/rest/v1/chat_messages?complaint_ref=eq.' + encodeURIComponent(complaintRef.toLowerCase()) +
      '&order=created_at.asc'
    );
    return Array.isArray(rows) ? rows : [];
  }

  /**
   * Fetch recent chat messages across all cases (admin inbox).
   */
  async function getAllMessages(limit) {
    if (!ready()) return [];
    var n = parseInt(limit, 10);
    if (isNaN(n) || n < 1) n = 1500;
    if (n > 3000) n = 3000;
    var rows = await get('/rest/v1/chat_messages?select=*&order=created_at.desc&limit=' + n);
    return Array.isArray(rows) ? rows : [];
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  /** Convert a raw Supabase complaints row into the normalised app object. */
  function _normalise(row) {
    if (!row) return null;
    var p = row.payload || {};
    if (typeof p === 'string') {
      try { p = JSON.parse(p) || {}; } catch (e) { p = {}; }
    }
    return {
      // IDs
      id:            row.id,
      trackingId:    row.tracking_id || p.trackingId || row.reference_number || '',
      matterId:      row.matter_id   || p.matterId   || '',
      // Personal
      name:          row.name        || p.name       || '',
      email:         row.email       || p.email      || p.compEmail || p.emailAddress || '',
      phone:         row.phone       || p.phone      || p.compPhone || '',
      country:       row.country     || p.country    || '',
      // Case details
      scamType:      row.scam_type   || p.scamType   || p.txType    || '',
      txType:        row.scam_type   || p.scamType   || p.txType    || '',
      lossAmount:    row.loss_amount || p.lossAmount  || p.moneyLost || p.totalLoss || '',
      moneyLost:     row.loss_amount || p.lossAmount  || p.moneyLost || p.totalLoss || '',
      description:   p.incidentDescription || p.description || '',
      timeframe:     p.timeframe     || '',
      // Status
      status:        row.case_status || 'Under Review',
      caseStatus:    row.case_status || 'Under Review',
      pipelineStage: typeof row.pipeline_stage === 'number' ? row.pipeline_stage : 0,
      docketEntries: (function () {
        var entries = row.docket_entries;
        if (typeof entries === 'string') {
          try { entries = JSON.parse(entries); } catch (e) { entries = []; }
        }
        return Array.isArray(entries) ? entries : [];
      })(),
      submittedAt:   row.submitted_at || new Date().toISOString(),
      recoveredAmount: (p.recoveredAmount !== undefined && p.recoveredAmount !== null && p.recoveredAmount !== '')
        ? p.recoveredAmount : '$0.00',
      recoveryProgress: (function () {
        var n = parseInt(p.recoveryProgress, 10);
        return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
      })(),
      clearedAmount: (p.clearedAmount !== undefined && p.clearedAmount !== null && p.clearedAmount !== '')
        ? p.clearedAmount : '$0.00',
      // Raw payload for anything else
      payload:       p
    };
  }

  // ─── EXPORT ────────────────────────────────────────────────────────────────

  window.IC3API = {
    ready,
    submitComplaint,
    loginUser,
    getUserRecord,
    getAllComplaints,
    updateComplaint,
    createClient,
    sendMessage,
    uploadChatAttachment,
    isChatBlocked,
    getMessages,
    getAllMessages
  };

  // Legacy alias so old code using ComplaintBackend still works during transition
  window.ComplaintBackend = {
    isConfigured:       ready,
    submitComplaint:    submitComplaint,
    fetchUserRecord:    getUserRecord,
    fetchAllReporters:  getAllComplaints
  };

})();
