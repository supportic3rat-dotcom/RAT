create table if not exists public.admin_blocked_chats (
    complaint_ref text primary key,
    blocked_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_blocked_chats enable row level security;
revoke all on public.admin_blocked_chats from public, anon, authenticated;

create or replace function public.is_admin_chat_blocked(p_complaint_ref text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.admin_blocked_chats
        where complaint_ref = lower(coalesce(p_complaint_ref, ''))
    );
$$;

revoke all on function public.is_admin_chat_blocked(text) from public;
grant execute on function public.is_admin_chat_blocked(text) to anon, authenticated;

drop policy if exists "Allow anon chat inserts" on public.chat_messages;
create policy "Allow anon chat inserts" on public.chat_messages
    for insert to anon, authenticated
    with check (
        sender = 'user'
        and not public.is_admin_chat_blocked(complaint_ref)
    );
