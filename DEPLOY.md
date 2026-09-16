# Deploying Nest to your own GitHub + Netlify

This is a TanStack Start (React + Vite) app. Its database/auth runs on Lovable
Cloud (Supabase). Deploying the frontend to your own Netlify keeps the
existing database and accounts.

## 1. Push to your GitHub

```bash
cd nest-budget
git init
git add -A
git commit -m "Nest budget app"
git branch -M main
git remote add origin https://github.com/<your-user>/nest-budget.git
git push -u origin main
```

(If you cloned rather than unzipped, skip `git init` and just push to your repo.)

## 2. Import into Netlify

1. Netlify → **Add new site → Import an existing project → GitHub**
2. Pick your `nest-budget` repo.
3. Build settings are read automatically from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Netlify installs dependencies from `bun.lock` automatically.

## 3. Set environment variables

In Netlify → **Site settings → Environment variables**, add these three
(values are the publishable/anon keys for the existing backend — safe for the
browser build):

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

Use the exact values provided to you separately. Redeploy after setting them.

## 4. Add your domain to the backend's allowed sign-in URLs

After your site is live on Netlify (e.g. `nest-budget.netlify.app` or your
custom domain), tell me the URL so I can add it to the backend's list of
allowed redirect URLs. Until then, Google sign-in and email-confirm links may
not point at your new domain.
