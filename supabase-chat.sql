-- =====================================================================
-- PUJA ADDA: paid community chat. Run once in Supabase > SQL Editor (safe to run again).
-- Prerequisite: supabase-schema.sql (creates public.admins and admin_summary).
-- Members get a secret ID (PJ-XXXXX-XXXXX) created by the admin after payment. Tables stay locked (RLS, no policies);
-- everything goes through the validated functions below.
-- =====================================================================
create table if not exists public.chat_members (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  nickname text,
  note text,                                    -- admin only: payment ref / phone
  status text not null default 'active' check (status in ('active','muted','blocked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen timestamptz
);
alter table public.chat_members add column if not exists tier text not null default 'paid' check (tier in ('free','paid'));
alter table public.chat_members add column if not exists created_ip text;
alter table public.chat_members add column if not exists phone text;
alter table public.chat_members add column if not exists pin_salt text;
alter table public.chat_members add column if not exists pin_hash text;
alter table public.chat_members add column if not exists pin_fails int not null default 0;
alter table public.chat_members add column if not exists locked_until timestamptz;
create unique index if not exists chat_members_phone on public.chat_members(phone) where phone is not null;
create index if not exists chat_members_ip on public.chat_members(created_ip, created_at);
create table if not exists public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security;
-- Chat is FREE (self-created IDs) until this moment. Change it any time from the admin page.
insert into public.app_settings(key, value) values ('chat_free_until', '2026-10-16T23:59:59+05:30') on conflict (key) do nothing;
-- Free chat was extended from 9 Oct to 16 Oct. If the setting still holds the old default, move it (and the free accounts) forward.
-- A date you chose yourself in the admin page is never touched.
update public.app_settings set value = '2026-10-16T23:59:59+05:30' where key = 'chat_free_until' and value = '2026-10-09T23:59:59+05:30';
update public.chat_members set expires_at = timestamptz '2026-10-16 23:59:59+05:30' where tier = 'free' and expires_at = timestamptz '2026-10-09 23:59:59+05:30';
create table if not exists public.chat_devices (
  member_id uuid not null references public.chat_members(id) on delete cascade,
  device_id text not null,
  first_seen timestamptz not null default now(),
  primary key (member_id, device_id)
);
create table if not exists public.chat_posts (
  id bigserial primary key,
  room text not null check (room in ('general','north','south','east','food')),
  member_id uuid not null references public.chat_members(id) on delete cascade,
  nickname text not null,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index if not exists chat_posts_room_id on public.chat_posts(room, id desc);
create table if not exists public.chat_reports (
  id bigserial primary key,
  post_id bigint not null references public.chat_posts(id) on delete cascade,
  reporter uuid references public.chat_members(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false,
  unique (post_id, reporter)
);
create table if not exists public.chat_attempts (id bigserial primary key, ip text, at timestamptz not null default now());
create index if not exists chat_attempts_at on public.chat_attempts(at);
alter table public.chat_members  enable row level security;
alter table public.chat_devices  enable row level security;
alter table public.chat_posts    enable row level security;
alter table public.chat_reports  enable row level security;
alter table public.chat_attempts enable row level security;

-- ---------- internal helpers (not callable from the website) ----------
create or replace function public._chat_ip() returns text language plpgsql stable as $$
declare h json; v text;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then h := '{}'::json; end;
  if h is null then h := '{}'::json; end if;
  v := nullif(trim(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', split_part(coalesce(h->>'x-forwarded-for',''), ',', 1), '')), '');
  return coalesce(v, 'unknown');
end $$;

-- Checks the ID + device. Returns the member, or an error code (never raises, so failed attempts are still recorded).
create or replace function public._chat_auth(p_code text, p_device text, out m public.chat_members, out err text)
language plpgsql security definer set search_path = public as $$
declare v_ip text := public._chat_ip(); n int; c text := upper(trim(coalesce(p_code,'')));
begin
  if random() < 0.02 then delete from public.chat_attempts where at < now() - interval '1 day'; end if;
  if (select count(*) from public.chat_attempts where ip = v_ip and at > now() - interval '10 minutes') >= 12
     or (select count(*) from public.chat_attempts where at > now() - interval '10 minutes') >= 400 then
    err := 'too_many'; return;
  end if;
  if c !~ '^PJ-[A-Z0-9]{5}-[A-Z0-9]{5}$' then
    insert into public.chat_attempts(ip) values (v_ip); err := 'invalid_id'; return;
  end if;
  select * into m from public.chat_members where code = c;
  if not found then
    insert into public.chat_attempts(ip) values (v_ip); err := 'invalid_id'; m := null; return;
  end if;
  if m.status = 'blocked' then err := 'blocked'; m := null; return; end if;
  if m.expires_at < now() then err := 'expired'; return; end if;
  if p_device is null or char_length(p_device) not between 8 and 100 then err := 'bad_device'; m := null; return; end if;
  if not exists (select 1 from public.chat_devices where member_id = m.id and device_id = p_device) then
    select count(*) into n from public.chat_devices where member_id = m.id;
    if n >= 2 then err := 'device_limit'; m := null; return; end if;
    insert into public.chat_devices(member_id, device_id) values (m.id, p_device);
  end if;
  update public.chat_members set last_seen = now() where id = m.id;
  err := null;
end $$;

create or replace function public._chat_clean_text(t text) returns boolean language sql immutable as $$
  select t !~* '(https?://|www\.|\.(com|in|net|org|io|co|me|app|xyz)\b|t\.me/|wa\.me|@[a-z0-9_]{3,})' and t !~ '\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d';
$$;

create or replace function public._is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(coalesce(auth.jwt()->>'email','')));
$$;

-- ---------- member functions ----------
create or replace function public.chat_login(p_code text, p_device text, p_nick text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a record; m public.chat_members; nick text := btrim(coalesce(p_nick,''));
begin
  select * into a from public._chat_auth(p_code, p_device);
  if a.err is not null then return jsonb_build_object('ok', false, 'error', a.err, 'tier', case when a.err = 'expired' then (a.m).tier end); end if;
  m := a.m;
  if m.nickname is null or m.nickname = '' then
    if nick = '' then return jsonb_build_object('ok', true, 'need_name', true, 'expires_at', m.expires_at, 'tier', m.tier); end if;
    if char_length(nick) not between 2 and 24 or nick ~ '[<>]' or not public._chat_clean_text(nick) then
      return jsonb_build_object('ok', false, 'error', 'bad_name');
    end if;
    update public.chat_members set nickname = nick where id = m.id; m.nickname := nick;
  end if;
  return jsonb_build_object('ok', true, 'nickname', m.nickname, 'status', m.status, 'expires_at', m.expires_at, 'tier', m.tier);
end $$;

create or replace function public.chat_fetch(p_code text, p_device text, p_room text, p_after bigint default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a record; m public.chat_members; rows jsonb;
begin
  select * into a from public._chat_auth(p_code, p_device);
  if a.err is not null then return jsonb_build_object('ok', false, 'error', a.err); end if;
  m := a.m;
  if p_room not in ('general','north','south','east','food') then return jsonb_build_object('ok', false, 'error', 'bad_room'); end if;
  select coalesce(jsonb_agg(x order by x.id), '[]'::jsonb) into rows from (
    select p.id, p.nickname as name, p.body, p.created_at as at, (p.member_id = m.id) as mine
    from public.chat_posts p
    where p.room = p_room and not p.deleted and p.id > coalesce(p_after, 0)
    order by p.id desc limit case when coalesce(p_after,0) = 0 then 60 else 100 end) x;
  return jsonb_build_object('ok', true, 'posts', rows, 'status', m.status);
end $$;

create or replace function public.chat_send(p_code text, p_device text, p_room text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a record; m public.chat_members; t text := btrim(coalesce(p_body,'')); rid bigint;
begin
  select * into a from public._chat_auth(p_code, p_device);
  if a.err is not null then return jsonb_build_object('ok', false, 'error', a.err); end if;
  m := a.m;
  if m.status = 'muted' then return jsonb_build_object('ok', false, 'error', 'muted'); end if;
  if m.nickname is null or m.nickname = '' then return jsonb_build_object('ok', false, 'error', 'need_name'); end if;
  if p_room not in ('general','north','south','east','food') then return jsonb_build_object('ok', false, 'error', 'bad_room'); end if;
  if char_length(t) not between 1 and 300 then return jsonb_build_object('ok', false, 'error', 'bad_text'); end if;
  if not public._chat_clean_text(t) then return jsonb_build_object('ok', false, 'error', 'links'); end if;
  if exists (select 1 from public.chat_posts where member_id = m.id and created_at > now() - interval '2 seconds')
     or (select count(*) from public.chat_posts where member_id = m.id and created_at > now() - interval '10 minutes') >= 40 then
    return jsonb_build_object('ok', false, 'error', 'rate');
  end if;
  insert into public.chat_posts(room, member_id, nickname, body) values (p_room, m.id, m.nickname, t) returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid);
end $$;

create or replace function public.chat_report(p_code text, p_device text, p_post bigint, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a record; m public.chat_members;
begin
  select * into a from public._chat_auth(p_code, p_device);
  if a.err is not null then return jsonb_build_object('ok', false, 'error', a.err); end if;
  m := a.m;
  if not exists (select 1 from public.chat_posts where id = p_post) then return jsonb_build_object('ok', false, 'error', 'bad_post'); end if;
  insert into public.chat_reports(post_id, reporter, reason) values (p_post, m.id, left(coalesce(p_reason,''), 200)) on conflict do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- lets a member move to a new phone: frees this device slot
create or replace function public.chat_leave(p_code text, p_device text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c text := upper(trim(coalesce(p_code,'')));
begin
  delete from public.chat_devices d using public.chat_members m where m.code = c and d.member_id = m.id and d.device_id = p_device;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- free chat window + self-created IDs ----------
create or replace function public._chat_free_until() returns timestamptz language sql stable security definer set search_path = public as $$
  select coalesce((select value::timestamptz from public.app_settings where key = 'chat_free_until'), timestamptz '2026-10-16 23:59:59+05:30');
$$;

create or replace function public.chat_info() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('free_until', public._chat_free_until(), 'free_open', now() <= public._chat_free_until(), 'now', now());
$$;

create or replace function public._chat_new_code() returns text language plpgsql volatile security definer set search_path = public as $$
declare alpha text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; raw bytea; v text; i int; tries int := 0;
begin
  loop
    raw := decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex');
    v := 'PJ-';
    for i in 0..9 loop
      v := v || substr(alpha, (get_byte(raw, i) % 31) + 1, 1);
      if i = 4 then v := v || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.chat_members m0 where m0.code = v);
    tries := tries + 1; if tries > 10 then raise exception 'Could not generate a unique ID'; end if;
  end loop;
  return v;
end $$;

-- Mobile numbers: accept 10 digits, +91 / 91 / 0 prefixes. Returns null if it is not an Indian mobile number.
create or replace function public._norm_phone(t text) returns text language plpgsql immutable as $$
declare d text := regexp_replace(coalesce(t,''), '\D', '', 'g');
begin
  if length(d) = 12 and left(d,2) = '91' then d := right(d,10);
  elsif length(d) = 11 and left(d,1) = '0' then d := right(d,10); end if;
  if d ~ '^[6-9][0-9]{9}$' then return d; end if;
  return null;
end $$;

create or replace function public._pin_hash(salt text, pin text) returns text language sql immutable as $$
  select encode(sha256(convert_to(salt || ':' || pin, 'UTF8')), 'hex');
$$;

-- Create a FREE account with nickname + mobile number + PIN while the free window is open. 5 per connection per day.
create or replace function public.chat_signup(p_device text, p_nick text, p_phone text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare nick text := btrim(coalesce(p_nick,'')); ph text := public._norm_phone(p_phone); v_ip text := public._chat_ip(); m public.chat_members; fu timestamptz := public._chat_free_until(); c text; salt text;
begin
  if now() > fu then return jsonb_build_object('ok', false, 'error', 'free_closed'); end if;
  if p_device is null or char_length(p_device) not between 8 and 100 then return jsonb_build_object('ok', false, 'error', 'bad_device'); end if;
  if char_length(nick) not between 2 and 24 or nick ~ '[<>]' or not public._chat_clean_text(nick) then return jsonb_build_object('ok', false, 'error', 'bad_name'); end if;
  if ph is null then return jsonb_build_object('ok', false, 'error', 'bad_phone'); end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then return jsonb_build_object('ok', false, 'error', 'bad_pin'); end if;
  if exists (select 1 from public.chat_members where phone = ph) then return jsonb_build_object('ok', false, 'error', 'phone_taken'); end if;
  if (select count(*) from public.chat_members where created_ip = v_ip and tier = 'free' and created_at > now() - interval '1 day') >= 5 then
    return jsonb_build_object('ok', false, 'error', 'too_many');
  end if;
  c := public._chat_new_code(); salt := replace(gen_random_uuid()::text, '-', '');
  insert into public.chat_members(code, nickname, note, expires_at, tier, created_ip, phone, pin_salt, pin_hash)
    values (c, nick, 'self-created (free)', fu, 'free', v_ip, ph, salt, public._pin_hash(salt, p_pin)) returning * into m;
  insert into public.chat_devices(member_id, device_id) values (m.id, p_device);
  return jsonb_build_object('ok', true, 'code', c, 'nickname', nick, 'expires_at', fu, 'tier', 'free');
end $$;

-- Sign in with mobile number + PIN (from any phone). 5 wrong PINs lock that number for 15 minutes.
create or replace function public.chat_signin(p_device text, p_phone text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ph text := public._norm_phone(p_phone); v_ip text := public._chat_ip(); m public.chat_members;
begin
  if (select count(*) from public.chat_attempts where ip = v_ip and at > now() - interval '10 minutes') >= 12 then return jsonb_build_object('ok', false, 'error', 'too_many'); end if;
  if ph is null or p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    insert into public.chat_attempts(ip) values (v_ip); return jsonb_build_object('ok', false, 'error', 'bad_credentials');
  end if;
  select * into m from public.chat_members where phone = ph;
  if not found or m.pin_hash is null then insert into public.chat_attempts(ip) values (v_ip); return jsonb_build_object('ok', false, 'error', 'bad_credentials'); end if;
  if m.locked_until is not null and m.locked_until > now() then return jsonb_build_object('ok', false, 'error', 'locked'); end if;
  if public._pin_hash(m.pin_salt, p_pin) <> m.pin_hash then
    update public.chat_members set
      locked_until = case when pin_fails + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
      pin_fails = case when pin_fails + 1 >= 5 then 0 else pin_fails + 1 end where id = m.id;
    insert into public.chat_attempts(ip) values (v_ip);
    return jsonb_build_object('ok', false, 'error', 'bad_credentials');
  end if;
  update public.chat_members set pin_fails = 0, locked_until = null where id = m.id;
  if m.status = 'blocked' then return jsonb_build_object('ok', false, 'error', 'blocked'); end if;
  if m.expires_at < now() then return jsonb_build_object('ok', false, 'error', 'expired', 'tier', m.tier); end if;
  return jsonb_build_object('ok', true, 'code', m.code, 'nickname', m.nickname, 'expires_at', m.expires_at, 'tier', m.tier);
end $$;

drop function if exists public.chat_self_create(text, text);

-- ---------- admin functions (only emails listed in public.admins) ----------
create or replace function public.admin_chat_create(p_nickname text default null, p_note text default null, p_expires timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare alpha text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; raw bytea; v_code text; i int; tries int := 0; mid uuid; exp timestamptz := coalesce(p_expires, timestamptz '2026-11-05 00:00+05:30');
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  loop
    raw := decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex');
    v_code := 'PJ-';
    for i in 0..9 loop
      v_code := v_code || substr(alpha, (get_byte(raw, i) % 31) + 1, 1);
      if i = 4 then v_code := v_code || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.chat_members m0 where m0.code = v_code);
    tries := tries + 1; if tries > 10 then raise exception 'Could not generate a unique ID'; end if;
  end loop;
  insert into public.chat_members(code, nickname, note, expires_at) values (v_code, nullif(btrim(coalesce(p_nickname,'')),''), left(coalesce(p_note,''),300), exp) returning id into mid;
  return jsonb_build_object('id', mid, 'code', v_code, 'expires_at', exp);
end $$;

create or replace function public.admin_chat_list(p_q text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rows jsonb; q text := nullif(btrim(coalesce(p_q,'')), '');
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into rows from (
    select m.id, m.code, m.nickname, m.phone, m.note, m.status, m.tier, m.created_at, m.expires_at, m.last_seen,
           (m.expires_at < now()) as expired,
           (select count(*) from public.chat_devices d where d.member_id = m.id) as devices,
           (select count(*) from public.chat_posts p where p.member_id = m.id) as posts
    from public.chat_members m
    where q is null or m.code ilike '%'||q||'%' or m.nickname ilike '%'||q||'%' or m.note ilike '%'||q||'%' or m.phone like '%'||q||'%'
    order by m.created_at desc limit 300) x;
  return jsonb_build_object('members', rows,
    'totals', jsonb_build_object('all', (select count(*) from public.chat_members),
      'active', (select count(*) from public.chat_members where status = 'active' and expires_at >= now()),
      'free', (select count(*) from public.chat_members where tier = 'free'),
      'paid', (select count(*) from public.chat_members where tier = 'paid'),
      'online', (select count(*) from public.chat_members where last_seen > now() - interval '2 minutes'),
      'posts', (select count(*) from public.chat_posts where not deleted),
      'reports', (select count(*) from public.chat_reports where not resolved)));
end $$;

create or replace function public.admin_chat_update(p_id uuid, p_status text default null, p_expires timestamptz default null, p_note text default null, p_reset_devices boolean default false, p_nickname text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  if p_status is not null and p_status not in ('active','muted','blocked') then raise exception 'Bad status'; end if;
  update public.chat_members set status = coalesce(p_status, status), expires_at = coalesce(p_expires, expires_at),
         note = coalesce(p_note, note), nickname = coalesce(nullif(btrim(p_nickname),''), nickname) where id = p_id;
  if coalesce(p_reset_devices, false) then delete from public.chat_devices where member_id = p_id; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_chat_reports()
returns jsonb language plpgsql security definer set search_path = public as $$
declare rows jsonb;
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into rows from (
    select r.id, r.post_id, r.reason, r.created_at, p.body, p.nickname, p.room, p.member_id, p.deleted, m.code
    from public.chat_reports r join public.chat_posts p on p.id = r.post_id join public.chat_members m on m.id = p.member_id
    where not r.resolved order by r.created_at desc limit 100) x;
  return rows;
end $$;

create or replace function public.admin_chat_moderate(p_post bigint, p_delete boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  if coalesce(p_delete, true) then update public.chat_posts set deleted = true where id = p_post; end if;
  update public.chat_reports set resolved = true where post_id = p_post;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_chat_reset_pin(p_id uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare salt text := replace(gen_random_uuid()::text, '-', '');
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then raise exception 'PIN must be 4 to 6 digits'; end if;
  update public.chat_members set pin_salt = salt, pin_hash = public._pin_hash(salt, p_pin), pin_fails = 0, locked_until = null where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_chat_set_free_until(p_until timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  insert into public.app_settings(key, value) values ('chat_free_until', to_char(p_until at time zone 'Asia/Kolkata', 'YYYY-MM-DD"T"HH24:MI:SS') || '+05:30')
    on conflict (key) do update set value = excluded.value;
  update public.chat_members set expires_at = p_until where tier = 'free';       -- free IDs follow the new end date
  return jsonb_build_object('ok', true, 'free_until', p_until);
end $$;

-- ---------- who may call what ----------
revoke all on function public._chat_ip() from public, anon, authenticated;
revoke all on function public._chat_auth(text,text) from public, anon, authenticated;
revoke all on function public._chat_clean_text(text) from public, anon, authenticated;
revoke all on function public._is_admin() from public, anon, authenticated;
revoke all on function public._chat_free_until() from public, anon, authenticated;
revoke all on function public._chat_new_code() from public, anon, authenticated;
revoke all on function public.chat_login(text,text,text) from public;
revoke all on function public.chat_fetch(text,text,text,bigint) from public;
revoke all on function public.chat_send(text,text,text,text) from public;
revoke all on function public.chat_report(text,text,bigint,text) from public;
revoke all on function public.chat_leave(text,text) from public;
grant execute on function public.chat_login(text,text,text) to anon, authenticated;
grant execute on function public.chat_fetch(text,text,text,bigint) to anon, authenticated;
grant execute on function public.chat_send(text,text,text,text) to anon, authenticated;
grant execute on function public.chat_report(text,text,bigint,text) to anon, authenticated;
grant execute on function public.chat_leave(text,text) to anon, authenticated;
revoke all on function public.admin_chat_create(text,text,timestamptz) from public, anon;
revoke all on function public.admin_chat_list(text) from public, anon;
revoke all on function public.admin_chat_update(uuid,text,timestamptz,text,boolean,text) from public, anon;
revoke all on function public.admin_chat_reports() from public, anon;
revoke all on function public.admin_chat_moderate(bigint,boolean) from public, anon;
grant execute on function public.admin_chat_create(text,text,timestamptz) to authenticated;
grant execute on function public.admin_chat_list(text) to authenticated;
grant execute on function public.admin_chat_update(uuid,text,timestamptz,text,boolean,text) to authenticated;
grant execute on function public.admin_chat_reports() to authenticated;
grant execute on function public.admin_chat_moderate(bigint,boolean) to authenticated;

revoke all on function public.chat_info() from public;
revoke all on function public._norm_phone(text) from public, anon, authenticated;
revoke all on function public._pin_hash(text,text) from public, anon, authenticated;
revoke all on function public.chat_signup(text,text,text,text) from public;
revoke all on function public.chat_signin(text,text,text) from public;
grant execute on function public.chat_info() to anon, authenticated;
grant execute on function public.chat_signup(text,text,text,text) to anon, authenticated;
grant execute on function public.chat_signin(text,text,text) to anon, authenticated;
revoke all on function public.admin_chat_reset_pin(uuid,text) from public, anon;
grant execute on function public.admin_chat_reset_pin(uuid,text) to authenticated;
revoke all on function public.admin_chat_set_free_until(timestamptz) from public, anon;
grant execute on function public.admin_chat_set_free_until(timestamptz) to authenticated;
