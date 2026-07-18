-- REDCHAIN MALAYSIA — SAFE PRESENTATION SEED
-- Run after 01_schema.sql. This adds system announcements only; it creates no fake users or medical requests.
-- The NOT EXISTS checks make this script safe to run more than once.

insert into public.announcements (title, message, severity, is_active, created_by)
select 'Welcome to RedChain Malaysia', 'Complete your profile, submit donor verification and use patient initials only when creating an emergency request.', 'info', true, null
where not exists (select 1 from public.announcements where title = 'Welcome to RedChain Malaysia');

insert into public.announcements (title, message, severity, is_active, created_by)
select 'Hospital screening remains mandatory', 'RedChain supports coordination but does not confirm donor eligibility, blood compatibility or clinical suitability.', 'warning', true, null
where not exists (select 1 from public.announcements where title = 'Hospital screening remains mandatory');

insert into public.announcements (title, message, severity, is_active, created_by)
select 'Protect personal information', 'Never place phone numbers, identity numbers or sensitive medical history in public request notes.', 'info', true, null
where not exists (select 1 from public.announcements where title = 'Protect personal information');
