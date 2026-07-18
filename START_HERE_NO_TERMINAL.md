# RedChain Malaysia — Start Here (No Terminal)

This package is prepared for a **GitHub → Vercel → Supabase** deployment using only website dashboards. You do not need Command Prompt, PowerShell, VS Code terminal, npm commands or Supabase CLI.

## What is already completed

- Professional responsive Next.js interface
- Malaysia states and cities
- Donor, recipient and organisation accounts
- Email/password authentication and password reset
- Public emergency request board without public phone numbers
- Donor profile, availability and location matching
- Private donor verification document upload
- Administrator verification workflow
- Consent-based donor contact sharing
- Emergency request creation and private requester contact storage
- Donor offers, requester acceptance and status tracking
- Member dashboard and notifications
- Administrator dashboard, moderation, announcements and audit logs
- Research feedback survey and analytics
- Supabase Row Level Security policies
- Private Supabase Storage bucket
- Vercel-ready environment variable configuration

## Files to use

1. `supabase/01_schema.sql` — installs the complete database and security rules.
2. `supabase/02_seed_malaysia.sql` — adds safe presentation announcements.
3. `supabase/03_make_admin.sql` — promotes your registered account to administrator.
4. `supabase/04_presentation_demo_reset.sql` — optional demo reset.
5. `.env.example` — shows the two Vercel environment variable names.
6. `PRESENTATION_DEMO.md` — exact demonstration order and speaking points.

---

# Deployment order

## Step 1 — Create a Supabase project

1. Sign in to Supabase.
2. Select **New project**.
3. Choose an organisation, project name and strong database password.
4. Select the closest available region for Malaysia/Southeast Asia.
5. Wait until the project dashboard opens.

## Step 2 — Install the RedChain database

1. In Supabase, open **SQL Editor**.
2. Select **New query**.
3. Open `supabase/01_schema.sql` from this package.
4. Select all its content, copy it, paste it into Supabase and select **Run**.
5. Confirm that the result says: `RedChain Malaysia schema installed successfully.`
6. Create another query.
7. Copy and run `supabase/02_seed_malaysia.sql`.

Important: `01_schema.sql` is designed for a fresh RedChain project. Running it again deletes existing RedChain data.

## Step 3 — Copy the two Supabase values

In Supabase project settings, open the API section and copy:

- **Project URL**
- **Publishable key** (`sb_publishable_...`)

Do not place a secret key or service-role key in this website.

## Step 4 — Upload the project to GitHub without terminal

1. Extract the ZIP on your computer.
2. Create a new **personal GitHub repository**.
3. Keep the repository private or public according to your assignment requirement.
4. Open the empty repository.
5. Select **Add file → Upload files**.
6. Drag all files and folders from inside the extracted `redchain-malaysia` folder into the upload page.
7. Make sure these items are visible before committing: `app`, `components`, `contexts`, `lib`, `public`, `supabase`, `package.json`, `package-lock.json`, `next.config.mjs` and the guide files.
8. Do not upload the ZIP itself as the project source.
9. Select **Commit changes**.

The package intentionally does not contain `node_modules` or `.next`; Vercel creates them automatically during deployment.

## Step 5 — Import the GitHub repository into Vercel

1. Sign in to the new Vercel account.
2. Select **Add New → Project**.
3. Connect GitHub when requested.
4. Import the RedChain repository from your personal GitHub account.
5. Keep **Framework Preset: Next.js**.
6. Do not change Build Command, Output Directory or Install Command.
7. Before deploying, open **Environment Variables** and add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |

8. Add both values to Production, Preview and Development environments.
9. Select **Deploy**.
10. Open the generated Vercel domain after the deployment succeeds.

## Step 6 — Configure Supabase authentication URLs

Copy your exact Vercel production domain, for example:

`https://your-redchain-name.vercel.app`

Then in Supabase:

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to your exact Vercel production domain.
3. Add these **Redirect URLs**:

- `https://your-redchain-name.vercel.app/auth/callback`
- `https://your-redchain-name.vercel.app/reset-password`

4. Save the changes.

## Step 7 — Register your account and make it admin

1. Open the deployed RedChain website.
2. Select **Join RedChain**.
3. Register using the email you will use for the presentation.
4. Confirm the email from the Supabase authentication email.
5. Sign in once so the profile is created.
6. In Supabase SQL Editor, open `supabase/03_make_admin.sql`.
7. Replace both occurrences of `YOUR_LOGIN_EMAIL` with your exact login email.
8. Run the query.
9. Sign out and sign back in, or refresh the RedChain dashboard.
10. The **Admin Control Centre** should now be available.

## Step 8 — Prepare presentation users

For the clearest demonstration, create three accounts using three email addresses or browser profiles:

- Administrator
- Donor
- Recipient/requester

Recommended demonstration:

1. Donor completes profile and uploads verification.
2. Admin reviews and approves the donor.
3. Recipient creates an emergency request.
4. Donor finds the request and offers help.
5. Recipient accepts the donor.
6. Approved participants see only the contact details allowed by the workflow.
7. Admin shows audit logs and research feedback analytics.

Read `PRESENTATION_DEMO.md` for the exact presentation flow.

---

# Important safety and privacy behaviour

- Public pages never query private profile phone numbers or emails.
- Donor contact details are stored in `private_profiles` and protected by Row Level Security.
- Requester contact details are stored separately in `request_private_contacts`.
- Verification documents are stored in a private Storage bucket.
- Donors control standalone contact-access requests.
- Accepted donor responses allow the request owner to access the accepted donor's preferred contact information.
- The platform supports coordination only. Hospitals or authorised blood centres must confirm eligibility, compatibility and clinical suitability.
- Use patient initials, not full patient names, in public requests.

# Common problems

## “Supabase connection is not configured”

The environment variables are missing or were added after the last deployment. Add both variables in Vercel and select **Redeploy**.

## Email confirmation returns to the wrong page

Check Supabase **Authentication → URL Configuration** and confirm the production domain and both redirect URLs exactly match the deployed Vercel domain.

## Admin menu does not appear

Confirm `03_make_admin.sql` used the exact registered email. Then sign out and sign back in.

## Verification upload fails

Confirm `01_schema.sql` completed successfully and the `verification-documents` bucket exists under Supabase Storage. Files must be PDF, JPG or PNG and no larger than 5 MB.

## A donor does not appear in search

The donor must:

- Have account type `donor`
- Select a blood group
- Be approved by an administrator
- Keep **Available for matching** enabled
- Have an active account

## Vercel deployment cannot access the repository

Use a repository under your personal GitHub account and make sure the commit/upload is authored by the same GitHub account connected to the Vercel Hobby account.
