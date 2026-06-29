# Supabase — saving birth inputs

Every successful Kundli generation writes one row of **birth inputs** (name, birth
date/time, place, house system, ayanamsa, timestamp) to a Supabase table. The write
is server-side and fire-and-forget: if Supabase is unreachable or unconfigured, the
chart still generates normally — the save is just skipped.

## How it's wired

| Piece | File |
| --- | --- |
| Server client + `saveBirthInput()` | [`web/lib/supabase.ts`](../web/lib/supabase.ts) |
| Insert call (fire-and-forget) | [`web/app/api/kundli/route.ts`](../web/app/api/kundli/route.ts) |
| Table schema | [`supabase/schema.sql`](../supabase/schema.sql) |

The service-role key bypasses Row Level Security, so it must stay server-side. The
module imports `server-only` to make an accidental client import a build error, and
the env vars have **no** `NEXT_PUBLIC_` prefix, so they're never sent to the browser.

## One-time setup

### 1. Create the table

Supabase dashboard → **SQL Editor** → New query → paste the contents of
[`supabase/schema.sql`](../supabase/schema.sql) → **Run**.

### 2. Get the credentials

Dashboard → **Project Settings → API**:

- `SUPABASE_URL` ← **Project URL**
- `SUPABASE_SERVICE_ROLE_KEY` ← **Project API keys → `service_role`** (the secret one, not `anon`)

### 3a. Local development

```bash
cp web/.env.local.example web/.env.local
# then edit web/.env.local and paste the two values
```

Restart `next dev` so it picks up the new env vars.

### 3b. Production (cPanel "Setup Node.js App")

Env vars in `.env.local` are **not** deployed. Set them on the server:

cPanel → **Setup Node.js App** → your app → **Environment variables** → add
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` → **Save**, then **Restart** the app.
(Passenger only re-reads env vars on restart — same manual-restart rule as code deploys.)

## De-duplication

The same chart isn't stored twice. "Same person" = **name + birth_date + birth_time +
exact coordinates** (`place_lat`/`place_lon`). House system and ayanamsa are *not* part
of the key — they're display settings, so re-generating the same person with a different
ayanamsa keeps the first row instead of adding a duplicate.

It's enforced by the `birth_inputs_identity_idx` UNIQUE index plus an upsert with
`ON CONFLICT DO NOTHING`, so duplicates are rejected at the DB level even under
concurrent requests.

If the table **already has duplicate rows**, creating the unique index will fail. Remove
the older copies first, then re-run `schema.sql`:

```sql
-- keep the most recent row of each identity, delete the rest
delete from public.birth_inputs a
using public.birth_inputs b
where a.ctid < b.ctid
  and a.name        is not distinct from b.name
  and a.birth_date  = b.birth_date
  and a.birth_time  = b.birth_time
  and a.place_lat   is not distinct from b.place_lat
  and a.place_lon   is not distinct from b.place_lon;
```

## Verifying

After generating a chart, check the rows in Supabase dashboard → **Table Editor →
`birth_inputs`**, or:

```sql
select created_at, name, birth_date, birth_time, place_label
from public.birth_inputs
order by created_at desc
limit 20;
```

If rows aren't appearing, check the server logs for `[supabase] saveBirthInput …`
warnings — the helper logs (never throws) on failure.
