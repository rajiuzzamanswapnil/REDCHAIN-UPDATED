# RedChain Malaysia

RedChain is a privacy-aware blood donor management and emergency matching web application designed for Malaysia. It replaces unstructured social-media searching with verified donor profiles, structured emergency requests, location-aware matching and controlled contact sharing.

## Technology

- Next.js App Router
- React
- Supabase Authentication
- Supabase PostgreSQL database
- Supabase Row Level Security
- Supabase private Storage
- Vercel deployment

## Main roles

- **Donor:** maintains blood group, general location, availability and verification status; responds to requests; approves contact access.
- **Recipient/requester:** creates emergency blood requests, searches verified donors and accepts donor offers.
- **Organisation:** can coordinate requests using the same protected workflow.
- **Administrator:** verifies donors, reviews private documents, moderates requests, manages accounts, publishes announcements and reviews audit/feedback data.

## Core modules

1. Authentication and role-aware profiles
2. Donor registration and availability
3. Donor verification
4. Emergency request management
5. Donor search and filtering
6. Privacy-controlled communication
7. Contact-access requests
8. Donor offer and acceptance workflow
9. Notifications
10. Administrator dashboard
11. Audit logs
12. Research feedback analytics

## Deploy without terminal

Open `START_HERE_NO_TERMINAL.md` and follow the steps in order.

## Database files

Run in this order:

1. `supabase/01_schema.sql`
2. `supabase/02_seed_malaysia.sql`
3. Register your website account
4. `supabase/03_make_admin.sql`

`supabase/04_presentation_demo_reset.sql` is optional and should be used only to clear demonstration transactions while keeping user profiles.

## Required Vercel environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Never add a Supabase secret key or service-role key to browser code or a `NEXT_PUBLIC_` environment variable.

## Privacy model

- `profiles`: safe member-facing display information
- `private_profiles`: legal name and contact information
- `donor_profiles`: blood group, availability and verification state
- `request_private_contacts`: private requester contact information
- `verification_documents`: private Storage metadata
- RLS policies decide which authenticated user can read or change each record

## Presentation

Use `PRESENTATION_DEMO.md` for the complete demonstration order, test scenario and simple speaking script.
