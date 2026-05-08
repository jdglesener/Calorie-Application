# Discipline App — Phase Roadmap

## Phase 1 — Calorie Counter ✅ Complete

**Goal:** Register → search food → log entries → view daily totals → navigate dates.

### Completed
- SvelteKit scaffold with TypeScript strict mode
- PostgreSQL schema: auth, profiles, food_items, daily_logs, food_entries
- Better Auth: email/password login and registration (Argon2id, HTTP-only cookies)
- GraphQL Yoga API integrated into SvelteKit routes
- urql client with SSR support
- Food search with brand/name lookup (fixed: scoped to matching name/brand + user-owned items)
- Custom food item creation (inline in FoodSearch — create then immediately select)
- Daily food log with per-entry delete and inline edit (servings, meal type, scaled macros)
- Date navigation (prev/next day, jump to today) — local-timezone safe
- MacroSummary card with calorie progress bar and per-macro progress bars
- Dashboard with streak counter and today's log preview
- Profile & Goals page: TDEE calculator (Mifflin-St Jeor), macro goals, imperial/metric toggle
- Calorie streak — server-side, local-timezone correct
- Mobile bottom tab bar with SVG icons
- Desktop sidebar nav
- Seed script with ~50 common food items

---

## Phase 1.5 — Barcode Scanning ✅ Complete

**Goal:** Point phone camera at a barcode → food auto-populates in the log form.

### User flow
1. Tap **Scan barcode** button inside the food search panel
2. Device rear camera opens in an overlay
3. User points at a product barcode (UPC-A, EAN-13, EAN-8)
4. On successful decode, app calls `lookupBarcode(barcode)` GraphQL query
5. Server checks `food_items.externalId` first (cache hit → instant)
6. On cache miss, fetches Open Food Facts API (free, no key required)
7. Parses response → upserts a system food item → returns it
8. Food auto-selected in the serving form — user sets servings + meal → Add to log

### New dependency
```
pnpm add @zxing/library
```
`@zxing/library` — ZXing JS port, decodes 1D/2D barcodes from a camera stream.
Client-side only (no server bundle impact). ~200 KB gzipped.

### New GraphQL

**typedef addition** (`food/typedefs.ts`):
```graphql
extend type Query {
  lookupBarcode(barcode: String!): FoodItem
}
```

**resolver** (`food/resolvers.ts`):
```typescript
lookupBarcode: async (_, { barcode }, ctx) => {
  requireAuth(ctx);
  // validate: digits only, 8–14 chars
  if (!/^\d{8,14}$/.test(barcode)) throw new GraphQLError('Invalid barcode');

  // 1. DB cache hit
  const cached = await ctx.db.select().from(foodItems)
    .where(eq(foodItems.externalId, barcode)).limit(1);
  if (cached[0]) return cached[0];

  // 2. Open Food Facts
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  const json = await res.json();
  if (json.status !== 1) return null;

  const p = json.product;
  const n = p.nutriments;
  // prefer per-serving values, fall back to per-100g
  const kcal = n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0;
  const [size, unit] = parseServing(p.serving_size); // helper to split "28 g" → [28, 'g']

  const [item] = await ctx.db.insert(foodItems).values({
    name: p.product_name ?? 'Unknown product',
    brand: p.brands ?? undefined,
    servingSize: String(size),
    servingUnit: unit,
    caloriesPerServing: Math.round(kcal),
    proteinG: n['proteins_serving'] != null ? String(n['proteins_serving']) : undefined,
    carbsG: n['carbohydrates_serving'] != null ? String(n['carbohydrates_serving']) : undefined,
    fatG: n['fat_serving'] != null ? String(n['fat_serving']) : undefined,
    externalId: barcode,
    isVerified: false,
    createdBy: null, // system-owned, visible to all
  }).onConflictDoNothing().returning();

  return item ?? null;
}
```

### New component — `BarcodeScanner.svelte`

```
src/lib/components/calories/BarcodeScanner.svelte
```

Responsibilities:
- Requests `getUserMedia({ video: { facingMode: 'environment' } })`
- Streams video to a `<video>` element
- Uses `BrowserMultiFormatReader` from `@zxing/library` to continuously decode frames
- Emits `onScanned(code: string)` on first successful decode, then stops the stream
- Emits `onCancel()` when the user closes the overlay
- Shows a semi-transparent overlay with a crosshair guide box and "Point at barcode" label
- Handles camera permission denial gracefully (shows error message)

### Integration into `FoodSearch.svelte`

1. Add a `LOOKUP_BARCODE` gql query
2. Add `showScanner = $state(false)`
3. Add a **Scan barcode** button next to the search input (shows only if `window.isSecureContext` — camera requires HTTPS or localhost)
4. When `BarcodeScanner` emits `onScanned(code)`:
   - Set `showScanner = false`
   - Execute `lookupBarcode(code)` query
   - On result: call `selectFood(result)` — drops straight into the servings form
   - On null: show "Product not found — try searching by name or creating a custom food"

### Security & validation
- Barcode validated server-side: `/^\d{8,14}$/` (rejects non-numeric, wrong length)
- Open Food Facts called **server-side only** — client never touches the external API
- Rate limit `lookupBarcode` to 10 req/min per user (add to resolver, same pattern as auth)
- `isVerified: false` on all scanned items — a future admin review flow can flip this
- `createdBy: null` makes the item global (visible to all users on search), same as seeds

### DB change
None — `food_items.externalId` column already exists in the schema.

### Serving size parser helper
Open Food Facts returns serving_size as a free-form string (`"28 g"`, `"1 cup (240ml)"`, `"1 bar"`).
Write a small `parseServing(str)` helper that:
- Tries to extract a leading number + unit (`/^([\d.]+)\s*([a-zA-Z]+)/`)
- Falls back to `[1, 'serving']` if unparseable

### Implementation order
1. `pnpm add @zxing/library`
2. Add `lookupBarcode` typedef + Zod validator + resolver (with OFF fetch + `parseServing`)
3. Build `BarcodeScanner.svelte` (camera overlay, ZXing decode loop)
4. Wire into `FoodSearch.svelte` (scan button, query call, auto-select)
5. Test on mobile (HTTPS or localhost) — barcode detection works best in good lighting

---

## Phase 2 — Social + Challenges

**Goal:** Add friends, create calorie challenges, compete on a leaderboard.

### Schema additions
- `friends`: requester, addressee, status (pending / accepted / blocked)
- `challenges`: name, type, targetValue, startDate, endDate, isPublic, status
- `challenge_participants`: per-user join status
- `challenge_entries`: daily metric snapshots (auto-upserted on food log save)

### GraphQL additions
- Queries: `friends`, `pendingFriendRequests`, `searchUsers`, `challenge`, `myChallenges`
- Mutations: `sendFriendRequest`, `respondToFriendRequest`, `removeFriend`, `blockUser`, `createChallenge`, `inviteToChallenge`, `respondToChallenge`, `cancelChallenge`

### Routes
- `/friends` — friend list + pending requests
- `/challenges` — active challenges list
- `/challenges/new` — create a challenge
- `/challenges/[id]` — leaderboard + participant progress

### Security notes
- Leaderboard only visible to participants with `status = 'accepted'`
- `searchUsers` returns `PublicUserProfile` only (no email, no calorie data)
- Challenge entry upsert triggered server-side on food log save (not client-driven)

---

## Phase 3 — Additional Disciplines

Each discipline follows the same pattern: new schema file → new GraphQL domain → new route group → challenge type extension.

### Sleep Tracking
- Schema: `sleep_logs` (userId, date, bedtime, wakeTime, hoursSlept, quality 1–5)
- Queries: `sleepLog(date)`, `sleepLogs(startDate, endDate)`
- Mutations: `upsertSleepLog`
- Route: `/sleep/[date]`
- Challenge type: `SLEEP_HOURS`

### Exercise Tracking
- Schema: `exercise_logs` (userId, date, type, durationMin, caloriesBurned, notes)
- Queries: `exerciseLogs(startDate, endDate)`
- Mutations: `addExerciseEntry`, `deleteExerciseEntry`
- Route: `/exercise/[date]`
- Challenge types: `EXERCISE_MINUTES`, `EXERCISE_DAYS`
- Net calorie calculation on dashboard (eaten − burned)

### Budget Tracking
- Schema: `budget_entries` (userId, date, category, description, amountCents, type income/expense)
- Security: financial data, apply extra field-level auth checks
- Routes: `/budget`, `/budget/[month]`
- Challenge type: `SPENDING_LIMIT`

### Bible / Reading Plans
- Schema: `reading_plans` (name, totalDays, entries per day), `reading_progress` (userId, planId, day, completedAt)
- Routes: `/read`, `/read/[planId]`
- Challenge type: `READING_STREAK`

---

## Phase 4 — Polish & Production

- Push notifications (web push or email digest) for streak reminders
- Progressive Web App manifest + offline support
- GraphQL introspection disabled in production
- PgBouncer / Supabase pooler for connection pooling
- Reverse proxy TLS (nginx / Caddy)
- `pnpm db:migrate` workflow replacing `db:push`
- End-to-end test suite (Playwright)
- Analytics dashboard (weekly/monthly calorie trends, weight over time)
