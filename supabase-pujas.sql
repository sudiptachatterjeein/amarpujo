-- =====================================================================
-- ADD YOUR PUJA: visitors submit a puja (name, location, photo). Admin approves before it appears.
-- Run after supabase-schema.sql and supabase-chat.sql (needs public.admins and public._chat_clean_text). Safe to run again.
-- Photos use the existing public "puja-photos" bucket (supabase-photos.sql), under community/pujas/.
-- =====================================================================
create table if not exists public.community_pujas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  note text check (note is null or char_length(note) <= 160),
  address text check (address is null or char_length(address) <= 160),
  lat double precision not null check (lat between 21 and 24),
  lon double precision not null check (lon between 86.5 and 90),
  photo_url text not null,
  nickname text,
  client_id text,
  ip text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists community_pujas_status on public.community_pujas(status, created_at desc);
create index if not exists community_pujas_ip on public.community_pujas(ip, created_at);
alter table public.community_pujas enable row level security;

create or replace function public.puja_submit(p_name text, p_note text, p_address text, p_lat double precision, p_lon double precision, p_photo text, p_nick text, p_client text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ip text := public._chat_ip(); nm text := btrim(coalesce(p_name,'')); nt text := nullif(btrim(coalesce(p_note,'')),''); ad text := nullif(btrim(coalesce(p_address,'')),''); nk text := nullif(btrim(coalesce(p_nick,'')),'');
begin
  if char_length(nm) not between 3 and 80 or not public._chat_clean_text(nm) then return jsonb_build_object('ok', false, 'error', 'bad_name'); end if;
  if nt is not null and (char_length(nt) > 160 or not public._chat_clean_text(nt)) then return jsonb_build_object('ok', false, 'error', 'bad_text'); end if;
  if ad is not null and (char_length(ad) > 160 or not public._chat_clean_text(ad)) then return jsonb_build_object('ok', false, 'error', 'bad_text'); end if;
  if nk is not null and (char_length(nk) > 24 or not public._chat_clean_text(nk)) then nk := null; end if;
  if p_lat is null or p_lon is null or p_lat not between 21 and 24 or p_lon not between 86.5 and 90 then return jsonb_build_object('ok', false, 'error', 'bad_location'); end if;
  if p_photo is null or p_photo not like 'https://obrtopvixqemwhvzadda.supabase.co/storage/v1/object/public/puja-photos/community/pujas/%' then return jsonb_build_object('ok', false, 'error', 'bad_photo'); end if;
  if p_client is null or char_length(p_client) not between 8 and 100 then return jsonb_build_object('ok', false, 'error', 'bad_client'); end if;
  if (select count(*) from public.community_pujas where client_id = p_client and created_at > now() - interval '1 day') >= 3
     or (select count(*) from public.community_pujas where ip = v_ip and created_at > now() - interval '1 day') >= 10 then
    return jsonb_build_object('ok', false, 'error', 'too_many');
  end if;
  insert into public.community_pujas(name, note, address, lat, lon, photo_url, nickname, client_id, ip) values (nm, nt, ad, p_lat, p_lon, left(p_photo, 500), nk, p_client, v_ip);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.puja_community_list()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select id, name, note, address, lat, lon, photo_url, nickname, created_at
    from public.community_pujas where status = 'approved' order by created_at desc limit 200) x;
$$;

create or replace function public.admin_puja_list(p_status text default 'pending')
returns jsonb language plpgsql security definer set search_path = public as $$
declare rows jsonb;
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into rows from (
    select id, name, note, address, lat, lon, photo_url, nickname, ip, status, created_at
    from public.community_pujas where p_status is null or status = p_status order by created_at desc limit 200) x;
  return jsonb_build_object('pujas', rows, 'counts', jsonb_build_object(
    'pending', (select count(*) from public.community_pujas where status = 'pending'),
    'approved', (select count(*) from public.community_pujas where status = 'approved'),
    'rejected', (select count(*) from public.community_pujas where status = 'rejected')));
end $$;

create or replace function public.admin_puja_set(p_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  if p_status not in ('pending','approved','rejected') then raise exception 'Bad status'; end if;
  update public.community_pujas set status = p_status where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_puja_delete(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public._is_admin() then raise exception 'Not an admin'; end if;
  delete from public.community_pujas where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.puja_submit(text,text,text,double precision,double precision,text,text,text) from public;
revoke all on function public.puja_community_list() from public;
grant execute on function public.puja_submit(text,text,text,double precision,double precision,text,text,text) to anon, authenticated;
grant execute on function public.puja_community_list() to anon, authenticated;
revoke all on function public.admin_puja_list(text) from public, anon;
revoke all on function public.admin_puja_set(uuid,text) from public, anon;
revoke all on function public.admin_puja_delete(uuid) from public, anon;
grant execute on function public.admin_puja_list(text) to authenticated;
grant execute on function public.admin_puja_set(uuid,text) to authenticated;
grant execute on function public.admin_puja_delete(uuid) to authenticated;
