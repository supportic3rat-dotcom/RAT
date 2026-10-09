create extension if not exists pgcrypto;

create table if not exists public.admin_credentials (
    id smallint primary key default 1 check (id = 1),
    password_hash text not null,
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_credentials enable row level security;
revoke all on public.admin_credentials from public, anon, authenticated;

insert into public.admin_credentials (id, password_hash)
values (1, crypt('admin1234', gen_salt('bf', 12)))
on conflict (id) do nothing;

create or replace function public.verify_admin_passcode(p_password text)
returns boolean
language sql
security definer
set search_path = public, extensions, pg_temp
as $$
    select coalesce((
        select password_hash = crypt(coalesce(p_password, ''), password_hash)
        from public.admin_credentials
        where id = 1
    ), false);
$$;

create or replace function public.change_admin_passcode(
    p_current_password text,
    p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
    current_hash text;
begin
    if p_current_password is null
        or p_new_password is null
        or char_length(p_new_password) < 12
        or char_length(p_new_password) > 128 then
        return false;
    end if;

    select password_hash
    into current_hash
    from public.admin_credentials
    where id = 1
    for update;

    if current_hash is null
        or current_hash <> crypt(p_current_password, current_hash) then
        return false;
    end if;

    update public.admin_credentials
    set password_hash = crypt(p_new_password, gen_salt('bf', 12)),
        updated_at = timezone('utc', now())
    where id = 1;

    return true;
end;
$$;

revoke all on function public.verify_admin_passcode(text) from public;
revoke all on function public.change_admin_passcode(text, text) from public;
grant execute on function public.verify_admin_passcode(text) to anon, authenticated;
grant execute on function public.change_admin_passcode(text, text) to anon, authenticated;
