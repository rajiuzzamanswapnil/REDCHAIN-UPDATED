# Vercel Deployment — No Terminal

## Repository preparation

- Use a repository owned by your personal GitHub account.
- Upload the extracted project files, not the ZIP as a single source file.
- Do not upload `node_modules` or `.next`.
- Confirm `package.json` and `package-lock.json` are in the repository root.

## Import settings

1. Vercel dashboard → **Add New → Project**
2. Import your GitHub repository
3. Framework preset: **Next.js**
4. Root directory: repository root
5. Keep default build settings

## Environment variables

Add before the first deployment:

```text
NEXT_PUBLIC_SUPABASE_URL = your Supabase Project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = your Supabase publishable key
```

Apply both to Production, Preview and Development.

## After deployment

1. Copy the exact production Vercel domain.
2. Add it to Supabase Authentication URL Configuration.
3. Add `/auth/callback` and `/reset-password` redirect URLs.
4. Test registration, confirmation, sign-in and password reset.

## Updating the website later

1. Open the repository in GitHub.
2. Edit a file using the pencil icon or upload replacement files.
3. Commit the change.
4. Vercel automatically starts a new deployment from the GitHub commit.

## Keep the Hobby project simple

This assignment build does not require a custom server, background worker, paid database add-on or Vercel Pro-only feature. Supabase supplies authentication, database and Storage; Vercel hosts the Next.js front end.
