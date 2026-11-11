# Purchase tracker

Multi-user purchase tracker (Want / Ordered / Delivered) built with **Next.js App Router**, **TypeScript**, and **Supabase** (Auth + Postgres).

- Phase 0: accounts, cloud-synced items, RLS
- Phase 1: free plan capped at **10** items (server + UI)
- Phase 2: Stripe **one-time $5** → lifetime Pro (`profiles.plan = pro`)

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Supabase Auth (email/password) + Postgres with Row Level Security
- Server Actions for item CRUD
- Stripe Checkout (`mode=payment`) + webhook for Pro unlock

## Setup (local)

### 1. Create a free Supabase project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server only**; needed for Stripe webhooks)

### 2. Run the SQL migration

1. In the Supabase dashboard open **SQL → New query**.
2. Paste the contents of [`supabase/migrations/001_profiles_items.sql`](supabase/migrations/001_profiles_items.sql).
3. Run it. This creates `profiles` + `items`, RLS policies, table grants for `authenticated` and `service_role`, and a trigger that inserts a `profiles` row (`plan = free`) on signup.

If you already ran an older `001` that had RLS but no grants, also run [`002_grants.sql`](supabase/migrations/002_grants.sql) (see Troubleshooting). If Stripe webhooks fail with `permission denied for table profiles` (Postgres `42501`) after `001`/`002`, run [`003_service_role_grants.sql`](supabase/migrations/003_service_role_grants.sql).

### 3. Auth settings (recommended for local)

In **Authentication → Providers → Email**:

- Enable Email provider.
- For local testing you can turn **off** “Confirm email” so sign-up goes straight to the app. If confirmations stay on, users must click the email link (callback: `/auth/callback`).

Add `http://localhost:3000/auth/callback` under **Authentication → URL Configuration → Redirect URLs**.

### 4. Env vars

```bash
cp .env.example .env.local
```

Edit `.env.local` with Supabase keys first, then Stripe (below).

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then add items on `/tracker`.

Without Supabase env vars the app still starts: login/signup show a clear “configure Supabase” message instead of crashing.

## Stripe — Pro lifetime ($5 one-time)

Use **Test mode** in the Stripe Dashboard (toggle in the top-right).

### Create a one-time $5 Price

1. Open [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products) (Test mode).
2. **Add product** → name e.g. `Purchase Tracker Pro`.
3. Pricing: **One time**, amount **$5.00** USD (not recurring).
4. Save. Copy the **Price ID** (`price_...`) → `STRIPE_PRICE_ID`.
5. **Developers → API keys**: copy **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`.
   - Publishable key (`pk_test_...`) is optional for this app (Checkout uses a server-created session URL). Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only if you add Stripe.js later.

### Local webhooks with Stripe CLI

Checkout success only unlocks Pro when `checkout.session.completed` hits `/api/stripe/webhook`.

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. `stripe login`
3. Forward events to the Next app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copy the printed **webhook signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET` in `.env.local`.
5. Restart `npm run dev` so the new secret is loaded.
6. Sign in → `/pricing` → **Upgrade — $5 lifetime** → pay with test card `4242 4242 4242 4242`.
7. Confirm `profiles.plan` is `pro` (and `stripe_customer_id` / `plan_status = lifetime` when present). Already-pro users see **You’re Pro** instead of another pay wall.

### Env vars (Stripe + webhook)

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | yes | Create Checkout sessions |
| `STRIPE_PRICE_ID` | yes | One-time $5 Price id |
| `STRIPE_WEBHOOK_SECRET` | yes | Verify webhook signatures |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (for webhook) | Set `profiles.plan = pro` server-side |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | no | Not used by redirect Checkout |
| `NEXT_PUBLIC_APP_URL` | prod recommended | Canonical origin for Checkout success/cancel (see Production) |

## Scripts

| Command        | Purpose              |
|----------------|----------------------|
| `npm run dev`  | Local Next.js server |
| `npm run build`| Production build     |
| `npm start`    | Serve production build |

## Production checklist (Vercel + Supabase + Stripe)

Prefer **Stripe test mode** on a Vercel **preview** URL first. Switch to live keys only after checkout + webhook unlock Pro successfully in test.

### A. Create / link the Vercel project

**Option 1 — Dashboard (simplest)**

1. Open [vercel.com/new](https://vercel.com/new) → **Import** → GitHub → `chends888/purchase-tracker`.
2. Framework preset: **Next.js** (auto). Root directory: repo root. Leave build/install defaults.
3. Do **not** paste secrets into the repo. Add env vars in the Vercel UI (section B) before or right after the first deploy.
4. Deploy. Note the production URL (`https://<project>.vercel.app` or your custom domain).

**Option 2 — CLI (from a machine logged into Vercel + GitHub)**

```bash
cd purchase-tracker
npx vercel login
npx vercel link          # link to existing project, or create one
npx vercel env pull      # optional: sync env names locally (never commit .env*)
npx vercel --prod        # production deploy after env + webhooks are ready
```

Preview deploy without promoting: `npx vercel` (omit `--prod`).

### B. Vercel environment variables

Set these for **Production** (and **Preview** while testing). Values never go in git.

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` (**server only**; webhook upgrades) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_test_...` first; later `sk_live_...`) |
| `STRIPE_PRICE_ID` | One-time $5 Price id (`price_...`; create a **live** Price when going live) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the **Dashboard** webhook endpoint (`whsec_...`) — not the Stripe CLI secret |
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` (no trailing slash). Required for a custom domain; strongly recommended on production so Checkout returns to the canonical host |

Optional: `FREE_ITEM_LIMIT` (default `10`). `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is unused for redirect Checkout.

After changing env vars, **redeploy** so the runtime picks them up.

### C. Supabase Auth redirect URLs

In **Authentication → URL Configuration**:

1. **Site URL**: `https://<your-domain>` (production).
2. **Redirect URLs** — add both:
   - `https://<your-domain>/auth/callback`
   - `https://<your-domain>/**` (optional catch-all) or each preview URL you use for auth testing
3. Keep `http://localhost:3000/auth/callback` for local.

Email confirm / magic links must land on `/auth/callback`.

### D. Stripe webhook (production / preview host)

1. Stripe Dashboard → **Developers → Webhooks** (start in **Test mode**).
2. **Add endpoint**: `https://<your-domain>/api/stripe/webhook`
3. Listen to **`checkout.session.completed`** only (this app ignores other events).
4. Copy the endpoint **Signing secret** (`whsec_...`) → Vercel `STRIPE_WEBHOOK_SECRET`.
5. Redeploy if you changed the secret after the last deploy.

Local CLI `stripe listen` secrets are **not** valid for the Dashboard endpoint — use a new `whsec` per endpoint.

### E. Test mode → live keys

1. On a **preview** (or staging) URL with **test** keys: sign up → `/pricing` → pay with `4242 4242 4242 4242` → confirm `profiles.plan = pro`.
2. When ready for real charges:
   - Create a **live** one-time $5 Product/Price → new `STRIPE_PRICE_ID`
   - Set `STRIPE_SECRET_KEY` to `sk_live_...`
   - Add a **Live mode** webhook to the same path → new live `STRIPE_WEBHOOK_SECRET`
   - Keep Supabase keys as-is; set `NEXT_PUBLIC_APP_URL` to the final domain
3. Redeploy Production. Do not mix test Price IDs with live secret keys.

## Schema overview

- **`profiles`**: `id` (FK `auth.users`), `email`, `stripe_customer_id`, `plan` (`free` \| `pro`), `plan_status`
- **`items`**: per-user purchase fields matching the UI (`name`, `store`, `price`, `url`, `notes`, `image`, `status`, `shipped_to`, `shipping_cost`, `handling_fee`, `category`)

RLS ensures each user only selects/inserts/updates/deletes their own rows. The Stripe webhook uses the **service role** key to update `plan` (no user session on that request). `service_role` bypasses RLS but still needs table `GRANT`s (`SELECT`/`UPDATE` on `profiles`, full CRUD on `items`) — see `003_service_role_grants.sql`.

## Troubleshooting

### `permission denied for table items` (or `profiles`)

RLS policies alone are not enough when Supabase **Automatically expose new tables** is off — roles also need `GRANT` privileges.

1. Open **SQL → New query** in the Supabase dashboard.
2. Paste and run [`supabase/migrations/002_grants.sql`](supabase/migrations/002_grants.sql).
3. Retry the app (sign in again if needed).

`002` is safe to re-run. It does **not** grant `INSERT` on `profiles` to `authenticated` (profile rows are created by the `handle_new_user` security-definer trigger). It also grants `service_role` privileges (same as `003`).

### Stripe webhook: `permission denied for table profiles` (Postgres `42501`)

The webhook’s admin client uses `SUPABASE_SERVICE_ROLE_KEY`. When table exposure/grants are restricted, `service_role` can still get `42501` on `profiles` even though RLS is bypassed.

1. Open **SQL → New query** in the Supabase dashboard.
2. Paste and run [`supabase/migrations/003_service_role_grants.sql`](supabase/migrations/003_service_role_grants.sql) (or re-run `002`, which includes the same grants).
3. Retry the checkout webhook (`stripe listen` replay or pay again in test mode).

`003` is safe to re-run. It grants `SELECT`/`UPDATE` on `profiles` and full CRUD on `items` to `service_role` only.

### Paid but still Free

1. Confirm `stripe listen` (local) or the Dashboard webhook endpoint is receiving `checkout.session.completed`.
2. Confirm `STRIPE_WEBHOOK_SECRET` matches that listener/endpoint.
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set and valid.
4. Confirm `service_role` table grants are applied (`003` / `002`) — see above if logs show Postgres `42501`.
5. Check the session’s `client_reference_id` / `metadata.user_id` is your auth user UUID.

## Free plan limit (Phase 1)

- Constant: `FREE_ITEM_LIMIT = 10` in `lib/constants.ts` (optional env override `FREE_ITEM_LIMIT`).
- Server: `createItem` rejects new items when `profiles.plan` is `free` and the user already has ≥ 10 items. `plan = pro` is uncapped.
- UI: at the cap, **+ Add Item** is disabled and a short upgrade nudge links to `/pricing`.

**Verify:** sign in as a free user, add 10 items, try an 11th — create should fail with a clear error and the Add button stays disabled.

## Out of scope (later)

- PayPal, Customer Portal / cancel flows (not needed for one-time Pro). Live Stripe keys are documented above once test checkout works.
