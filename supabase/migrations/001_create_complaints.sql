-- Complaint backend schema for Supabase (Netlify + Supabase integration)
-- Run this script in your Supabase project SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.complaints (
    id uuid primary key default gen_random_uuid(),
    reference_number text not null unique,
    email text,
    status text not null default 'submitted' check (status in ('submitted', 'in_review', 'resolved', 'closed')),
    payload jsonb not null,
    submitted_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.complaints add column if not exists name text;
alter table public.complaints add column if not exists tracking_id text;
alter table public.complaints add column if not exists matter_id text;
alter table public.complaints add column if not exists password_plain text;
alter table public.complaints add column if not exists phone text;
alter table public.complaints add column if not exists country text;
alter table public.complaints add column if not exists scam_type text;
alter table public.complaints add column if not exists loss_amount text;
alter table public.complaints add column if not exists case_status text default 'Under Review';
alter table public.complaints add column if not exists pipeline_stage integer default 0;
alter table public.complaints add column if not exists docket_entries jsonb default '[]'::jsonb;

-- Ensure email column exists if table was created previously without it
alter table public.complaints add column if not exists email text;

create index if not exists complaints_reference_number_idx on public.complaints(reference_number);
create index if not exists complaints_email_idx on public.complaints(email);
create index if not exists complaints_status_idx on public.complaints(status);
create index if not exists complaints_submitted_at_idx on public.complaints(submitted_at desc);

alter table public.complaints enable row level security;

-- Enable public anon INSERT for submitting complaints from Netlify hosted site
drop policy if exists "Allow anon insert complaints" on public.complaints;
create policy "Allow anon insert complaints" on public.complaints
    for insert to anon with check (true);

-- Enable public anon SELECT so users can retrieve their case in dashboard across devices
drop policy if exists "Allow anon select complaints" on public.complaints;
create policy "Allow anon select complaints" on public.complaints
    for select to anon using (true);

create or replace function public.set_complaints_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists complaints_updated_at on public.complaints;
create trigger complaints_updated_at
before update on public.complaints
for each row execute function public.set_complaints_updated_at();

create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    complaint_ref text not null,
    sender text not null check (sender in ('user', 'admin')),
    sender_name text not null default '',
    message text not null check (char_length(trim(message)) > 0 and char_length(message) <= 4000),
    attachment_url text,
    attachment_name text,
    attachment_type text,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.chat_messages add column if not exists attachment_url text;
alter table public.chat_messages add column if not exists attachment_name text;
alter table public.chat_messages add column if not exists attachment_type text;

create index if not exists chat_messages_complaint_ref_idx on public.chat_messages(complaint_ref);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Allow anon chat inserts" on public.chat_messages;
create policy "Allow anon chat inserts" on public.chat_messages
    for insert to anon with check (true);

drop policy if exists "Allow anon chat reads" on public.chat_messages;
create policy "Allow anon chat reads" on public.chat_messages
    for select to anon using (true);

drop policy if exists "Allow anon complaint updates" on public.complaints;
create policy "Allow anon complaint updates" on public.complaints
    for update to anon using (true) with check (true);

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    role text not null check (role in ('user', 'admin')),
    complaint_ref text not null,
    endpoint text not null unique,
    subscription jsonb not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists push_subscriptions_ref_idx on public.push_subscriptions(complaint_ref);
alter table public.push_subscriptions enable row level security;
drop policy if exists "Allow anon push subscription upserts" on public.push_subscriptions;
create policy "Allow anon push subscription upserts" on public.push_subscriptions
    for insert to anon with check (true);
drop policy if exists "Allow anon push subscription updates" on public.push_subscriptions;
create policy "Allow anon push subscription updates" on public.push_subscriptions
    for update to anon using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-media', 'chat-media', true, 5242880)
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "Allow anon chat media uploads" on storage.objects;
create policy "Allow anon chat media uploads" on storage.objects
    for insert to anon with check (bucket_id = 'chat-media');
