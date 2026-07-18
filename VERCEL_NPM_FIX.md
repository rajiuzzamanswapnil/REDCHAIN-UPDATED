# Vercel npm installation fix

This project version has been corrected for Vercel deployment.

## What was fixed

- All dependency URLs in `package-lock.json` now use the public npm registry.
- `.npmrc` explicitly uses `https://registry.npmjs.org/`.
- Node.js is pinned to `22.x`, which is required by the installed Supabase JavaScript SDK.
- npm is documented as version `10.9.2` through `packageManager`.

## Replace the failed GitHub repository

The safest no-terminal method is:

1. Open the GitHub repository.
2. Delete the old `package-lock.json`.
3. Upload this corrected project again, including the hidden `.npmrc` file.
4. Confirm `package.json`, `package-lock.json`, and `.npmrc` are at the repository root.
5. In Vercel, open **Project → Settings → General**.
6. Set **Root Directory** to the folder containing `package.json`. If the files are already at repository root, leave it blank.
7. Set **Node.js Version** to **22.x**.
8. Keep **Install Command** and **Build Command** on their defaults.
9. Open **Deployments**, choose the failed deployment, and select **Redeploy** with **Use existing Build Cache** turned off.

## Expected install source

The deployment log should now download packages from `registry.npmjs.org`, not an internal or private registry.
