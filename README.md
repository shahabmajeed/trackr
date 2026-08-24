# Trackr

Jira-style issue tracker powered by **Supabase Auth + Postgres**.

## Setup

1. Create a Supabase project (or use yours).
2. In **SQL Editor**, run in order:
   - `supabase/schema.sql` (if tables not already created)
   - `supabase/extensions.sql` (attachments, links, watchers, story points, storage)
3. Auth settings (Dashboard → Authentication):
   - Enable **Email** provider
   - Optionally require **email confirmation**
   - Add your app URL to **Redirect URLs** (e.g. `http://localhost:5173` and `http://localhost:5173?reset=1`)
4. Copy `.env.example` → `.env` and set:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

5. Install & run:

```bash
npm install
npm run dev
```

## Features

- Supabase Auth (hashed passwords, forgot password, email verification via Supabase settings)
- Profile edit (name, avatar, password)
- Issues: subtasks, attachments, links, epic container, due dates, story points, estimate vs logged time
- Comments: edit/delete, @mentions
- Activity history, watchers
- Manual time logs on issues and subtasks
- Auto time tracking while In Progress
- Sprint management, reports, subtasks as child issues

## Deploy to GitHub Pages

1. **Push this repo to GitHub** (see below).
2. In the GitHub repo go to **Settings → Secrets and variables → Actions** and add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/publishable key
3. Go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
4. Push to the `main` branch (or run the **Deploy to GitHub Pages** workflow manually). The site will be published at `https://<username>.github.io/<repo-name>/`.

5. In **Supabase → Authentication → URL configuration**, add your live URL to **Redirect URLs**, e.g.:
   - `https://<username>.github.io/<repo-name>`
   - `https://<username>.github.io/<repo-name>?reset=1`

## Push to GitHub (first time)

```bash
git init
git add .
git commit -m "Initial commit: Trackr issue tracker"
git branch -M main
git remote add origin https://github.com/<your-username>/trackr.git
git push -u origin main
```

Replace `<your-username>` with your GitHub username. Create an empty repo named `trackr` on GitHub first (no README/license).

**Alternative:** [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — connect the GitHub repo and set the same `VITE_*` environment variables in the dashboard.
