# Purchase tracker

Multi-user purchase tracker (Want / Ordered / Delivered) built with **Next.js App Router**, **TypeScript**, and **Supabase** (Auth + Postgres).

Phase 0: accounts, cloud-synced items, RLS. Stripe / free-item cap come later.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase Auth (email/password) + Postgres with Row Level Security
- Server Actions for item CRUD

## Setup (local)

### 1. Create a free Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the SQL migration

1. In the Supabase dashboard open **SQL → New query**.
2. Paste the contents of [`supabase/migrations/001_profiles_items.sql`](supabase/migrations/001_profiles_items.sql).
3. Run it. This creates `profiles` + `items`, RLS policies, table grants for `authenticated`, and a trigger that inserts a `profiles` row (`plan = free`) on signup.

If you already ran an older `001` that had RLS but no grants, also run [`002_grants.sql`](supabase/migrations/002_grants.sql) (see Troubleshooting).

### 3. Auth settings (recommended for local)

In **Authentication → Providers → Email**:

- Enable Email provider.
- For local testing you can turn **off** “Confirm email” so sign-up goes straight to the app. If confirmations stay on, users must click the email link (callback: `/auth/callback`).

Add `http://localhost:3000/auth/callback` under **Authentication → URL Configuration → Redirect URLs**.

### 4. Env vars

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
```

`SUPABASE_SERVICE_ROLE_KEY` is optional and **not required** for Phase 0. Never expose the service role key to the browser.

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then add items on `/tracker`.

Without env vars the app still starts: login/signup show a clear “configure Supabase” message instead of crashing.

## Scripts

| Command        | Purpose              |
|----------------|----------------------|
| `npm run dev`  | Local Next.js server |
| `npm run build`| Production build     |
| `npm start`    | Serve production build |

## Deploy (Vercel — document only for Phase 0)

1. Import this GitHub repo into [Vercel](https://vercel.com).
2. Set the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Add your Vercel URL to Supabase **Redirect URLs** (e.g. `https://your-app.vercel.app/auth/callback`).
4. Deploy. Do this when Lucas has a Supabase project ready — not required to finish Phase 0 locally.

## Schema overview

- **`profiles`**: `id` (FK `auth.users`), `email`, `stripe_customer_id`, `plan` (`free` \| `pro`), `plan_status`
- **`items`**: per-user purchase fields matching the UI (`name`, `store`, `price`, `url`, `notes`, `image`, `status`, `shipped_to`, `shipping_cost`, `handling_fee`, `category`)

RLS ensures each user only selects/inserts/updates/deletes their own rows.

## Troubleshooting

### `permission denied for table items` (or `profiles`)

RLS policies alone are not enough when Supabase **Automatically expose new tables** is off — roles also need `GRANT` privileges.

1. Open **SQL → New query** in the Supabase dashboard.
2. Paste and run [`supabase/migrations/002_grants.sql`](supabase/migrations/002_grants.sql).
3. Retry the app (sign in again if needed).

`002` is safe to re-run. It does **not** grant `INSERT` on `profiles` to `authenticated` (profile rows are created by the `handle_new_user` security-definer trigger).

## Out of scope (later phases)

- Free plan hard cap of 10 items (`FREE_ITEM_LIMIT` left commented in `lib/constants.ts`)
- Stripe Checkout / Customer Portal at $5/mo
