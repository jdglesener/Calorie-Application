# Discipline App

A personal discipline and accountability platform. Phase 1: calorie counter. Future phases: social challenges, sleep, exercise, budgeting, and Bible plans.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit (full-stack) + TypeScript |
| Database | PostgreSQL 15+ |
| ORM | Drizzle ORM |
| API | GraphQL Yoga (via SvelteKit API routes) |
| GraphQL Client | urql |
| Auth | Better Auth (Argon2id, session rotation) |
| Styling | Tailwind CSS (mobile-first) |
| Validation | Zod |

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm 9+** — `npm install -g pnpm`
- **PostgreSQL 15+** — choose one:
  - Local install: [postgresql.org](https://www.postgresql.org/download/)
  - Docker: `docker run --name discipline-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15`
  - Hosted: [Neon](https://neon.tech) / [Supabase](https://supabase.com) / [Railway](https://railway.app) (all have free tiers)

---

## First-Time Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Your PostgreSQL connection string
DATABASE_URL=postgresql://postgres:password@localhost:5432/discipline_app

# 32-byte random secret for Better Auth
# Generate one: openssl rand -base64 32
BETTER_AUTH_SECRET=your_secret_here

# App URL (no trailing slash)
PUBLIC_APP_URL=http://localhost:5173

NODE_ENV=development
```

### 3. Create the database (local PostgreSQL only)

```bash
createdb discipline_app
```

If using Docker or a hosted provider, create the database through their interface and paste the connection string into `DATABASE_URL`.

### 4. Push the schema

```bash
pnpm db:push
```

This creates all tables in your database. Use `pnpm db:push` during development.

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Register an account and start logging.

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm check` | SvelteKit sync + type check |
| `pnpm typecheck` | TypeScript type check only |
| `pnpm db:push` | Push schema changes to DB (dev only) |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:migrate` | Apply migration files (production) |
| `pnpm db:studio` | Open Drizzle Studio (visual DB browser) |
| `pnpm db:seed` | Seed the food_items table |
| `pnpm codegen` | Regenerate typed GraphQL hooks |

---

## GraphQL API

The GraphQL endpoint is available at `/api/graphql`.

In development, the GraphQL Yoga playground is accessible at that URL in your browser.

Run `pnpm codegen` after any schema change to regenerate TypeScript types in `src/lib/graphql/generated/graphql.ts`.

---

## Project Structure

```
src/
├── hooks.server.ts           # CORS, security headers, session injection
├── app.d.ts                  # SvelteKit type augmentation
├── lib/
│   ├── server/
│   │   ├── db/               # Drizzle client + schema
│   │   ├── auth/             # Better Auth instance + requireAuth guard
│   │   └── graphql/          # Yoga server, context, resolvers, validators
│   ├── graphql/
│   │   └── client.ts         # urql client
│   └── components/
│       ├── layout/           # Navbar, MobileNav
│       └── calories/         # FoodSearch, DailyLog, MacroSummary
└── routes/
    ├── api/graphql/          # GraphQL endpoint
    ├── api/auth/             # Better Auth handler
    ├── (auth)/               # Login, register, logout
    └── (app)/                # Protected: dashboard, calories, challenges, friends, profile
```

---

## Production Deployment

### 1. Environment

Set all variables from `.env.example` in your hosting provider's environment settings. Do **not** commit `.env`.

Set `NODE_ENV=production`.

### 2. Build

```bash
pnpm build
```

### 3. Database migrations

Use migration files instead of `db:push` in production:

```bash
pnpm db:generate   # generate migration SQL from schema changes
pnpm db:migrate    # apply migrations
```

### 4. Security checklist

- [ ] `useSecureCookies` is `true` when `NODE_ENV=production` (already set in `src/lib/server/auth/index.ts`)
- [ ] `maskedErrors` is `true` when `NODE_ENV=production` (already set in `src/lib/server/graphql/index.ts`)
- [ ] Add `useDisableIntrospection()` plugin to Yoga for production
- [ ] Set up TLS via reverse proxy (nginx, Caddy, or your hosting provider)
- [ ] Set up connection pooling (PgBouncer or Supabase pooler)
- [ ] Verify `PUBLIC_APP_URL` matches your production domain exactly

### Recommended hosting

- **App**: [Railway](https://railway.app), [Fly.io](https://fly.io), or [Vercel](https://vercel.com) (use `@sveltejs/adapter-vercel`)
- **Database**: [Neon](https://neon.tech) or [Supabase](https://supabase.com)

---

## Roadmap

### Phase 1 — Calorie Counter (current)
- Email/password auth
- Daily calorie logging with food search
- Macro tracking (protein, carbs, fat)
- Day-by-day navigation with streak counter
- Mobile-first responsive UI

### Phase 2 — Social + Challenges
- Friend requests and connections
- Create challenges (calorie limit/goal, steps, custom)
- Invite friends to challenges
- Leaderboards per challenge

### Phase 3 — Additional Disciplines
- Sleep tracking
- Exercise logging
- Bible reading plans
- Budgeting (with financial-grade security)
- Cross-discipline challenges

---

## Security

This application is built to financial-data security standards:

- Passwords hashed with **Argon2id** (via Better Auth)
- Sessions stored in **HTTP-only, SameSite cookies** — never localStorage
- All inputs validated with **Zod** before touching the database
- All queries scoped to the authenticated user — no cross-user data leakage
- Parameterized queries via Drizzle — no SQL injection risk
- Rate limiting on auth endpoints (10 attempts / 60s per IP)
- Security headers on every response (CSP, X-Frame-Options, etc.)
- Secrets in environment variables only — never in source code
