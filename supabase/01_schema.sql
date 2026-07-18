-- REDCHAIN MALAYSIA — FRESH SUPABASE INSTALLER
-- Run once in a NEW Supabase project: SQL Editor -> New query -> paste all -> Run.
-- WARNING: Re-running this file removes existing RedChain tables and data.

create extension if not exists pgcrypto;

-- Remove previous RedChain objects for a reliable fresh installation.
drop table if exists public.audit_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.announcements cascade;
drop table if exists public.feedback_responses cascade;
drop table if exists public.contact_requests cascade;
drop table if exists public.donor_responses cascade;
drop table if exists public.request_private_contacts cascade;
drop table if exists public.blood_requests cascade;
drop table if exists public.verification_documents cascade;
drop table if exists public.donor_profiles cascade;
drop table if exists public.private_profiles cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'RedChain Member',
  account_type text not null default 'recipient' check (account_type in ('donor','recipient','organization')),
  role text not null default 'member' check (role in ('member','admin')),
  state text,
  city text,
  avatar_url text,
  account_status text not null default 'active' check (account_status in ('active','suspended')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.private_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null default '',
  phone text,
  email text,
  contact_preference text not null default 'whatsapp' check (contact_preference in ('phone','email','whatsapp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donor_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  blood_group text check (blood_group is null or blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  is_available boolean not null default true,
  last_donation_date date,
  preferred_radius_km integer not null default 25 check (preferred_radius_km between 1 and 500),
  medical_declaration boolean not null default false,
  verification_status text not null default 'not_submitted' check (verification_status in ('not_submitted','pending','verified','rejected')),
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('identity_document','donor_card','organization_letter','other_supporting_document')),
  file_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 5242880),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  patient_initials text not null check (char_length(patient_initials) between 1 and 12),
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  blood_component text not null,
  units_needed integer not null check (units_needed between 1 and 20),
  hospital_name text not null,
  hospital_state text not null,
  hospital_city text not null,
  required_by timestamptz not null,
  urgency text not null default 'high' check (urgency in ('critical','high','medium','low')),
  reason_category text not null,
  public_notes text,
  status text not null default 'open' check (status in ('open','matched','fulfilled','cancelled','flagged')),
  moderated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_private_contacts (
  request_id uuid primary key references public.blood_requests(id) on delete cascade,
  contact_name text not null,
  phone text not null,
  email text,
  relation_to_patient text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donor_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  donor_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 2 and 500),
  status text not null default 'offered' check (status in ('offered','accepted','declined','withdrawn','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(request_id, donor_id)
);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  donor_id uuid not null references public.profiles(id) on delete cascade,
  blood_request_id uuid references public.blood_requests(id) on delete set null,
  message text not null check (char_length(message) between 2 and 500),
  status text not null default 'pending' check (status in ('pending','approved','declined','cancelled','expired')),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> donor_id)
);

create unique index contact_requests_one_pending_idx
  on public.contact_requests (requester_id, donor_id, coalesce(blood_request_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'pending';

create table public.feedback_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  usefulness_rating smallint not null check (usefulness_rating between 1 and 5),
  usability_rating smallint not null check (usability_rating between 1 and 5),
  trust_rating smallint not null check (trust_rating between 1 and 5),
  privacy_rating smallint not null check (privacy_rating between 1 and 5),
  would_recommend boolean not null,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index donor_profiles_search_idx on public.donor_profiles (verification_status, is_available, blood_group);
create index profiles_location_idx on public.profiles (state, city, account_status);
create index blood_requests_active_idx on public.blood_requests (status, blood_group, hospital_state, hospital_city, required_by);
create index contact_requests_participants_idx on public.contact_requests (requester_id, donor_id, status);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- SECURITY HELPER FUNCTIONS
create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and role = 'admin' and account_status = 'active'
  );
$$;

create or replace function public.is_active_member(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and account_status = 'active'
  );
$$;

create or replace function public.is_request_owner(target_request uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blood_requests
    where id = target_request and requester_id = auth.uid()
  );
$$;

create or replace function public.has_responded_to_request(target_request uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.donor_responses
    where request_id = target_request and donor_id = auth.uid()
  );
$$;

create or replace function public.request_is_active(target_request uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blood_requests
    where id = target_request and status in ('open','matched')
  );
$$;

create or replace function public.is_verified_available_donor(target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.donor_profiles dp
    join public.profiles p on p.id = dp.user_id
    where dp.user_id = target_user
      and dp.verification_status = 'verified'
      and dp.is_available = true
      and p.account_status = 'active'
  );
$$;

create or replace function public.can_view_private_profile(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_user = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.contact_requests cr
      where cr.requester_id = auth.uid()
        and cr.donor_id = target_user
        and cr.status = 'approved'
    )
    or exists (
      select 1
      from public.donor_responses dr
      join public.blood_requests br on br.id = dr.request_id
      where br.requester_id = auth.uid()
        and dr.donor_id = target_user
        and dr.status in ('accepted','completed')
    );
$$;

create or replace function public.can_view_request_contact(target_request uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.blood_requests br
      where br.id = target_request and br.requester_id = auth.uid()
    )
    or exists (
      select 1 from public.donor_responses dr
      where dr.request_id = target_request
        and dr.donor_id = auth.uid()
        and dr.status in ('accepted','completed')
    );
$$;

-- AUTOMATIC PROFILE CREATION AFTER SUPABASE AUTH SIGN-UP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_type text;
  safe_display_name text;
begin
  selected_type := case
    when new.raw_user_meta_data ->> 'account_type' in ('donor','recipient','organization')
      then new.raw_user_meta_data ->> 'account_type'
    else 'recipient'
  end;
  safe_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1),
    'RedChain Member'
  );

  insert into public.profiles (id, display_name, account_type, state, city)
  values (
    new.id,
    safe_display_name,
    selected_type,
    nullif(trim(new.raw_user_meta_data ->> 'state'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'city'), '')
  )
  on conflict (id) do nothing;

  insert into public.private_profiles (user_id, full_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), safe_display_name),
    new.email
  )
  on conflict (user_id) do nothing;

  if selected_type = 'donor' then
    insert into public.donor_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- UPDATED-AT TRIGGER
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger private_profiles_updated_at before update on public.private_profiles for each row execute procedure public.set_updated_at();
create trigger donor_profiles_updated_at before update on public.donor_profiles for each row execute procedure public.set_updated_at();
create trigger verification_documents_updated_at before update on public.verification_documents for each row execute procedure public.set_updated_at();
create trigger blood_requests_updated_at before update on public.blood_requests for each row execute procedure public.set_updated_at();
create trigger request_private_contacts_updated_at before update on public.request_private_contacts for each row execute procedure public.set_updated_at();
create trigger donor_responses_updated_at before update on public.donor_responses for each row execute procedure public.set_updated_at();
create trigger contact_requests_updated_at before update on public.contact_requests for each row execute procedure public.set_updated_at();
create trigger feedback_responses_updated_at before update on public.feedback_responses for each row execute procedure public.set_updated_at();
create trigger announcements_updated_at before update on public.announcements for each row execute procedure public.set_updated_at();

-- PROTECT ADMIN-ONLY FIELDS FROM NORMAL USERS
create or replace function public.guard_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role or new.account_status is distinct from old.account_status then
      raise exception 'Only an administrator can change role or account status';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_profile_admin_fields_trigger before update on public.profiles for each row execute procedure public.guard_profile_admin_fields();

create or replace function public.guard_donor_verification_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and auth.uid() is not null and not public.is_admin() then
    new.verification_status := 'not_submitted';
    new.verified_by := null;
    new.verified_at := null;
  elsif tg_op = 'UPDATE' and auth.uid() is not null and not public.is_admin() then
    if new.blood_group is distinct from old.blood_group and old.verification_status = 'verified' then
      new.verification_status := 'pending';
      new.verified_by := null;
      new.verified_at := null;
    end if;
    if new.verified_by is distinct from old.verified_by or new.verified_at is distinct from old.verified_at then
      if not (new.blood_group is distinct from old.blood_group and old.verification_status = 'verified') then
        raise exception 'Only an administrator can set verification approval fields';
      end if;
    end if;
    if new.verification_status is distinct from old.verification_status then
      if not (
        new.verification_status = 'pending'
        and (old.verification_status in ('not_submitted','rejected') or new.blood_group is distinct from old.blood_group)
      ) then
        raise exception 'Only an administrator can approve or reject donor verification';
      end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_donor_verification_fields_trigger before insert or update on public.donor_profiles for each row execute procedure public.guard_donor_verification_fields();

create or replace function public.guard_contact_request_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.requester_id is distinct from old.requester_id or new.donor_id is distinct from old.donor_id then
    raise exception 'Contact request participants cannot be changed';
  end if;
  if new.status is distinct from old.status then
    if auth.uid() = old.donor_id and old.status = 'pending' and new.status in ('approved','declined') then return new; end if;
    if auth.uid() = old.requester_id and old.status = 'pending' and new.status = 'cancelled' then return new; end if;
    raise exception 'This status transition is not allowed';
  end if;
  return new;
end;
$$;
create trigger guard_contact_request_status_trigger before update on public.contact_requests for each row execute procedure public.guard_contact_request_status();

create or replace function public.guard_donor_response_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  select requester_id into owner_id from public.blood_requests where id = old.request_id;
  if new.request_id is distinct from old.request_id or new.donor_id is distinct from old.donor_id then
    raise exception 'Response participants cannot be changed';
  end if;
  if new.status is distinct from old.status then
    if auth.uid() = old.donor_id and old.status in ('offered','accepted') and new.status in ('withdrawn','completed') then return new; end if;
    if auth.uid() = owner_id and old.status = 'offered' and new.status in ('accepted','declined') then return new; end if;
    if auth.uid() = owner_id and old.status = 'accepted' and new.status = 'completed' then return new; end if;
    raise exception 'This response status transition is not allowed';
  end if;
  return new;
end;
$$;
create trigger guard_donor_response_status_trigger before update on public.donor_responses for each row execute procedure public.guard_donor_response_status();

create or replace function public.guard_request_owner_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.requester_id is distinct from old.requester_id then
    raise exception 'Requester cannot be changed';
  end if;
  if new.status = 'flagged' then
    raise exception 'Only administrators can flag requests';
  end if;
  return new;
end;
$$;
create trigger guard_request_owner_fields_trigger before update on public.blood_requests for each row execute procedure public.guard_request_owner_fields();

-- NOTIFICATIONS
create or replace function public.notify_contact_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.donor_id, 'contact_request', 'New contact access request', 'A RedChain member requested permission to view your preferred contact details.', '/contact-requests');
  elsif new.status is distinct from old.status then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.requester_id, 'contact_decision', 'Contact request ' || new.status, 'The donor updated your contact access request.', '/contact-requests');
  end if;
  return new;
end;
$$;
create trigger notify_contact_request_trigger after insert or update on public.contact_requests for each row execute procedure public.notify_contact_request();

create or replace function public.notify_donor_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_owner uuid;
begin
  select requester_id into request_owner from public.blood_requests where id = new.request_id;
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, message, link)
    values (request_owner, 'donor_response', 'A donor offered help', 'A donor responded to your emergency blood request.', '/requests/' || new.request_id::text);
  elsif new.status is distinct from old.status then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.donor_id, 'response_update', 'Donor response ' || new.status, 'The requester updated your donor response.', '/requests/' || new.request_id::text);
  end if;
  return new;
end;
$$;
create trigger notify_donor_response_trigger after insert or update on public.donor_responses for each row execute procedure public.notify_donor_response();

create or replace function public.notify_verification_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved','rejected') then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.user_id, 'verification', 'Verification ' || new.status, coalesce(new.review_notes, 'Your donor verification has been reviewed.'), '/verification');
  end if;
  return new;
end;
$$;
create trigger notify_verification_decision_trigger after update on public.verification_documents for each row execute procedure public.notify_verification_decision();

create or replace function public.notify_request_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.requester_id, 'request_status', 'Request status: ' || new.status, 'Your emergency request status was updated.', '/requests/' || new.id::text);
  end if;
  return new;
end;
$$;
create trigger notify_request_update_trigger after update on public.blood_requests for each row execute procedure public.notify_request_update();

-- AUDIT LOGS
create or replace function public.audit_request_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'request_created' else 'request_updated' end,
    'blood_request',
    new.id,
    jsonb_build_object('status', new.status, 'blood_group', new.blood_group, 'hospital_state', new.hospital_state)
  );
  return new;
end;
$$;
create trigger audit_request_changes_trigger after insert or update on public.blood_requests for each row execute procedure public.audit_request_changes();

create or replace function public.audit_verification_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'verification_submitted' else 'verification_updated' end,
    'verification_document',
    new.id,
    jsonb_build_object('status', new.status, 'user_id', new.user_id)
  );
  return new;
end;
$$;
create trigger audit_verification_changes_trigger after insert or update on public.verification_documents for each row execute procedure public.audit_verification_changes();

create or replace function public.audit_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role or new.account_status is distinct from old.account_status or new.account_type is distinct from old.account_type then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (auth.uid(), 'profile_access_changed', 'profile', new.id, jsonb_build_object('role', new.role, 'account_status', new.account_status, 'account_type', new.account_type));
  end if;
  return new;
end;
$$;
create trigger audit_profile_changes_trigger after update on public.profiles for each row execute procedure public.audit_profile_changes();

-- PUBLIC HOME-PAGE STATISTICS
create or replace function public.get_public_stats()
returns table (verified_donors bigint, active_requests bigint, fulfilled_requests bigint, states_covered bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.donor_profiles dp join public.profiles p on p.id = dp.user_id where dp.verification_status = 'verified' and p.account_status = 'active')::bigint,
    (select count(*) from public.blood_requests where status in ('open','matched'))::bigint,
    (select count(*) from public.blood_requests where status = 'fulfilled')::bigint,
    16::bigint;
$$;

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.private_profiles enable row level security;
alter table public.donor_profiles enable row level security;
alter table public.verification_documents enable row level security;
alter table public.blood_requests enable row level security;
alter table public.request_private_contacts enable row level security;
alter table public.donor_responses enable row level security;
alter table public.contact_requests enable row level security;
alter table public.feedback_responses enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "Authenticated users view safe profiles" on public.profiles for select to authenticated
using (account_status = 'active' or id = auth.uid() or public.is_admin());
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Users update own profile or admin updates all" on public.profiles for update to authenticated
using ((id = auth.uid() and public.is_active_member()) or public.is_admin()) with check ((id = auth.uid() and public.is_active_member()) or public.is_admin());

create policy "Controlled private profile access" on public.private_profiles for select to authenticated
using (public.can_view_private_profile(user_id));
create policy "Users insert own private profile" on public.private_profiles for insert to authenticated with check ((user_id = auth.uid() and public.is_active_member()) or public.is_admin());
create policy "Users update own private profile" on public.private_profiles for update to authenticated
using ((user_id = auth.uid() and public.is_active_member()) or public.is_admin()) with check ((user_id = auth.uid() and public.is_active_member()) or public.is_admin());

create policy "Verified available donors visible to members" on public.donor_profiles for select to authenticated
using (user_id = auth.uid() or public.is_admin() or (verification_status = 'verified' and is_available = true));
create policy "Users create own donor profile" on public.donor_profiles for insert to authenticated with check ((user_id = auth.uid() and public.is_active_member()) or public.is_admin());
create policy "Users update own donor profile" on public.donor_profiles for update to authenticated
using ((user_id = auth.uid() and public.is_active_member()) or public.is_admin())
with check ((user_id = auth.uid() and public.is_active_member()) or public.is_admin());

create policy "Document owner or admin reads verification" on public.verification_documents for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy "Document owner submits verification" on public.verification_documents for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and public.is_active_member());
create policy "Admins review verification" on public.verification_documents for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "Owner removes unapproved document or admin removes" on public.verification_documents for delete to authenticated
using ((user_id = auth.uid() and status in ('pending','rejected')) or public.is_admin());

create policy "Public sees active request summaries" on public.blood_requests for select to anon
using (status in ('open','matched'));
create policy "Members see active, own, responded, or admin requests" on public.blood_requests for select to authenticated
using (
  status in ('open','matched')
  or requester_id = auth.uid()
  or public.is_admin()
  or public.has_responded_to_request(id)
);
create policy "Members create own requests" on public.blood_requests for insert to authenticated
with check (requester_id = auth.uid() and public.is_active_member());
create policy "Requester or admin updates request" on public.blood_requests for update to authenticated
using ((requester_id = auth.uid() and public.is_active_member()) or public.is_admin()) with check ((requester_id = auth.uid() and public.is_active_member()) or public.is_admin());

create policy "Controlled requester contact access" on public.request_private_contacts for select to authenticated
using (public.can_view_request_contact(request_id));
create policy "Requester inserts private contact" on public.request_private_contacts for insert to authenticated
with check (public.is_request_owner(request_id) and public.is_active_member());
create policy "Requester or admin updates private contact" on public.request_private_contacts for update to authenticated
using (public.is_admin() or (public.is_request_owner(request_id) and public.is_active_member()))
with check (public.is_admin() or (public.is_request_owner(request_id) and public.is_active_member()));

create policy "Response participants or admin can read" on public.donor_responses for select to authenticated
using (
  donor_id = auth.uid()
  or public.is_admin()
  or public.is_request_owner(request_id)
);
create policy "Verified donor can offer help" on public.donor_responses for insert to authenticated
with check (
  donor_id = auth.uid()
  and public.is_active_member()
  and public.is_verified_available_donor(auth.uid())
  and public.request_is_active(request_id)
);
create policy "Response participants or admin can update" on public.donor_responses for update to authenticated
using (
  public.is_admin()
  or (public.is_active_member() and (donor_id = auth.uid() or public.is_request_owner(request_id)))
) with check (
  public.is_admin()
  or (public.is_active_member() and (donor_id = auth.uid() or public.is_request_owner(request_id)))
);

create policy "Contact participants or admin can read" on public.contact_requests for select to authenticated
using (requester_id = auth.uid() or donor_id = auth.uid() or public.is_admin());
create policy "Members request verified donor contact" on public.contact_requests for insert to authenticated
with check (
  requester_id = auth.uid()
  and requester_id <> donor_id
  and public.is_active_member()
  and exists (select 1 from public.donor_profiles dp where dp.user_id = donor_id and dp.verification_status = 'verified' and dp.is_available = true)
);
create policy "Contact participants or admin update" on public.contact_requests for update to authenticated
using (((requester_id = auth.uid() or donor_id = auth.uid()) and public.is_active_member()) or public.is_admin())
with check (((requester_id = auth.uid() or donor_id = auth.uid()) and public.is_active_member()) or public.is_admin());

create policy "Owner or admin reads feedback" on public.feedback_responses for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy "User submits own feedback" on public.feedback_responses for insert to authenticated with check (user_id = auth.uid() and public.is_active_member());
create policy "User updates own feedback" on public.feedback_responses for update to authenticated
using (user_id = auth.uid() and public.is_active_member()) with check (user_id = auth.uid() and public.is_active_member());

create policy "Anyone reads active announcements" on public.announcements for select to anon, authenticated
using (is_active = true or public.is_admin());
create policy "Admins create announcements" on public.announcements for insert to authenticated with check (public.is_admin());
create policy "Admins update announcements" on public.announcements for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete announcements" on public.announcements for delete to authenticated using (public.is_admin());

create policy "Users read own notifications" on public.notifications for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy "Users update own notifications" on public.notifications for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Admins read audit logs" on public.audit_logs for select to authenticated using (public.is_admin());

-- SUPABASE STORAGE: PRIVATE VERIFICATION DOCUMENTS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-documents', 'verification-documents', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['application/pdf','image/jpeg','image/png'];

drop policy if exists "Users upload own verification files" on storage.objects;
drop policy if exists "Owners and admins read verification files" on storage.objects;
drop policy if exists "Owners and admins delete verification files" on storage.objects;

create policy "Users upload own verification files" on storage.objects for insert to authenticated
with check (
  bucket_id = 'verification-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Owners and admins read verification files" on storage.objects for select to authenticated
using (
  bucket_id = 'verification-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
create policy "Owners and admins delete verification files" on storage.objects for delete to authenticated
using (
  bucket_id = 'verification-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- FUNCTION PERMISSIONS
revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_active_member(uuid) from public;
revoke all on function public.is_request_owner(uuid) from public;
revoke all on function public.has_responded_to_request(uuid) from public;
revoke all on function public.request_is_active(uuid) from public;
revoke all on function public.is_verified_available_donor(uuid) from public;
revoke all on function public.can_view_private_profile(uuid) from public;
revoke all on function public.can_view_request_contact(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;
grant execute on function public.is_active_member(uuid) to authenticated;
grant execute on function public.is_request_owner(uuid) to authenticated;
grant execute on function public.has_responded_to_request(uuid) to authenticated;
grant execute on function public.request_is_active(uuid) to authenticated;
grant execute on function public.is_verified_available_donor(uuid) to authenticated;
grant execute on function public.can_view_private_profile(uuid) to authenticated;
grant execute on function public.can_view_request_contact(uuid) to authenticated;
revoke all on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated;

-- Standard table grants (RLS still controls every row).
grant usage on schema public to anon, authenticated;
grant select on public.blood_requests, public.announcements to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

do $$ begin
  raise notice 'RedChain Malaysia schema installed successfully.';
end $$;
