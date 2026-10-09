# Supabase deployment

The admin passcode is stored as a bcrypt hash in Supabase. To enable shared
passcode changes and chat moderation, apply the migrations and deploy the
`admin-auth` and `admin-moderation` Edge Functions to the same Supabase project
used by `js/supabase-config.js`:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy admin-auth
supabase functions deploy admin-moderation
```

The migration initializes the shared passcode to `admin1234` only if no admin
credential exists yet. Change it from **Security** in the admin console.
Existing unlocked browser sessions remain open and will use the new passcode
the next time they are locked or refreshed. Admin authentication is checked
against Supabase on every page load.

The admin page's access gate is still client-side only. Server-side
authorization must also protect admin data and operations before relying on it
for sensitive production access.

The `admin-moderation` function powers the admin chat controls:

- **Block chat** prevents the client from sending any further messages.
- **Unblock chat** restores messaging.
- **Delete chat** removes the conversation messages and its uploaded attachments,
  but keeps the complaint record.
- **Delete report** requires the latest `admin-moderation` function deployment.
  If the dashboard reports “Unsupported moderation action,” deploy it with
  `supabase functions deploy admin-moderation`; redeploying only the website
  does not update Supabase Edge Functions.

The chat moderation migration changes anon chat inserts so clients may only
send as `user`. Admin replies must go through the `admin-moderation` Edge
Function, which verifies the current shared admin passcode. Deploy the
`admin.html` and `js/complaint-backend.js` updates along with the Supabase
migrations and functions.

Apply both `002_admin_passcode.sql` and `003_admin_chat_moderation.sql` with
`supabase db push` before deploying the updated site. The admin chat toolbar
then offers **Block chat**, **Unblock chat**, and **Delete chat**. Deleting a
chat removes its messages and uploaded attachments but leaves the complaint
record in place. The admin dossier also offers **Delete report**, which
permanently removes the selected complaint, its associated chat history and
attachments, block entry, and push subscriptions after confirmation.
