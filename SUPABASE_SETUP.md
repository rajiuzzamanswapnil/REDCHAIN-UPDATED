# Supabase Setup Reference

Use this file when you need a compact checklist after reading `START_HERE_NO_TERMINAL.md`.

## SQL order

| Order | File | Purpose |
|---:|---|---|
| 1 | `supabase/01_schema.sql` | Creates all tables, triggers, functions, RLS policies and private Storage policies |
| 2 | `supabase/02_seed_malaysia.sql` | Adds safe Malaysia presentation announcements |
| 3 | `supabase/03_make_admin.sql` | Promotes your registered account to administrator |
| Optional | `supabase/04_presentation_demo_reset.sql` | Clears request/demo transactions while preserving users and profiles |

## Required project values

Copy the **Project URL** and **Publishable key** from Supabase project settings. Add them to Vercel with these exact names:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## Authentication URL configuration

Set your production Vercel domain as Site URL and add:

```text
https://YOUR-VERCEL-DOMAIN/auth/callback
https://YOUR-VERCEL-DOMAIN/reset-password
```

Replace `YOUR-VERCEL-DOMAIN` with the exact deployed domain.

## Email authentication

Email confirmation can remain enabled for a realistic assignment demonstration. A user must open the confirmation email before signing in when confirmation is enabled.

## Storage

The installer creates one private bucket:

```text
verification-documents
```

Accepted file types:

- PDF
- JPEG/JPG
- PNG

Maximum file size: 5 MB.

## Data separation

| Table | Contains |
|---|---|
| `profiles` | Display name, role, account type, state and city |
| `private_profiles` | Full name, phone, email and contact preference |
| `donor_profiles` | Blood group, availability, declaration and verification state |
| `verification_documents` | Private verification upload metadata |
| `blood_requests` | Public/operational request information |
| `request_private_contacts` | Requester contact details separated from the public request |
| `donor_responses` | Donor offers and acceptance states |
| `contact_requests` | Consent-based contact access workflow |
| `feedback_responses` | Research evaluation ratings |
| `announcements` | Administrator notices |
| `notifications` | User-specific updates |
| `audit_logs` | Administrative and workflow traceability |

## Reset warning

`01_schema.sql` drops and recreates RedChain tables. Use it only for a fresh installation or when you intentionally want to erase all RedChain data.

`04_presentation_demo_reset.sql` removes database records for requests, responses, feedback and verification submissions. It does not remove files already uploaded to Storage. Empty the `verification-documents` bucket manually before running the reset when you need a completely clean demonstration.
