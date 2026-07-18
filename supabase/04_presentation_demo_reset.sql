-- OPTIONAL: CLEAR PRESENTATION TRANSACTIONS WITHOUT DELETING USERS OR PROFILES
-- Use only when you want to restart the demo flow.

truncate table
  public.notifications,
  public.audit_logs,
  public.contact_requests,
  public.donor_responses,
  public.request_private_contacts,
  public.blood_requests,
  public.feedback_responses,
  public.verification_documents
restart identity cascade;

update public.donor_profiles
set verification_status = 'not_submitted', verified_by = null, verified_at = null, updated_at = now();
