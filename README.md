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
| `NEXT_PUBLIC_APP_URL` | no | Success/cancel URL origin (default `http://localhost:3000`) |

## Scripts

| Command        | Purpose              |
|----------------|----------------------|
| `npm run dev`  | Local Next.js server |
| `npm run build`| Production build     |
| `npm start`    | Serve production build |

## Deploy (Vercel — document only)

1. Import this GitHub repo into [Vercel](https://vercel.com).
2. Set env vars: Supabase (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`) + Stripe test keys (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`). Optionally `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`.
3. Add your Vercel URL to Supabase **Redirect URLs** (e.g. `https://your-app.vercel.app/auth/callback`).
4. In Stripe Dashboard → **Developers → Webhooks**, add endpoint `https://your-app.vercel.app/api/stripe/webhook` for event `checkout.session.completed` (Test mode). Paste that endpoint’s signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.
5. Deploy. Live mode / PayPal are out of scope for Phase 2.

## Schema overview

- **`profiles`**: `id` (FK `auth.users`), `email`, `stripe_customer_id`, `plan` (`free` \| `pro`), `plan_status`
- **`items`**: per-user purchase fields matching the UI (`name`, `store`, `price`, `url`, `notes`, `image`, `status`, `shipped_to`, `shipping_cost`, `handling_fee`, `category`)

RLS ensures each user only selects/inserts/updates/deletes their own rows. The Stripe webhook uses the **service role** key to update `plan` (no user session on that request).

## Troubleshooting

### `permission denied for table items` (or `profiles`)

RLS policies alone are not enough when Supabase **Automatically expose new tables** is off — roles also need `GRANT` privileges.

1. Open **SQL → New query** in the Supabase dashboard.
2. Paste and run [`supabase/migrations/002_grants.sql`](supabase/migrations/002_grants.sql).
3. Retry the app (sign in again if needed).

`002` is safe to re-run. It does **not** grant `INSERT` on `profiles` to `authenticated` (profile rows are created by the `handle_new_user` security-definer trigger).

### Paid but still Free

1. Confirm `stripe listen` (local) or the Dashboard webhook endpoint is receiving `checkout.session.completed`.
2. Confirm `STRIPE_WEBHOOK_SECRET` matches that listener/endpoint.
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` is set and valid.
4. Check the session’s `client_reference_id` / `metadata.user_id` is your auth user UUID.

## Free plan limit (Phase 1)

- Constant: `FREE_ITEM_LIMIT = 10` in `lib/constants.ts` (optional env override `FREE_ITEM_LIMIT`).
- Server: `createItem` rejects new items when `profiles.plan` is `free` and the user already has ≥ 10 items. `plan = pro` is uncapped.
- UI: at the cap, **+ Add Item** is disabled and a short upgrade nudge links to `/pricing`.

**Verify:** sign in as a free user, add 10 items, try an 11th — create should fail with a clear error and the Add button stays disabled.

## Out of scope (later)

- PayPal, Stripe live mode, Customer Portal / cancel flows (not needed for one-time Pro)
