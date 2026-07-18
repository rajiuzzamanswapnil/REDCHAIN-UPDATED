-- REDCHAIN MALAYSIA — MAKE YOUR ACCOUNT ADMIN
-- 1) Register your account in the deployed RedChain website first.
-- 2) Replace YOUR_LOGIN_EMAIL below with the same email used to register.
-- 3) Run this entire query in Supabase SQL Editor.

update public.profiles
set role = 'admin', account_status = 'active', updated_at = now()
where id = (
  select id from auth.users
  where lower(email) = lower('YOUR_LOGIN_EMAIL')
  limit 1
);

select p.display_name, u.email, p.role, p.account_status
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('YOUR_LOGIN_EMAIL');
