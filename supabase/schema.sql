-- Astrochakra — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Stores the birth inputs submitted each time a Kundli is generated. Writes happen
-- server-side in web/app/api/kundli/route.ts using the service_role key, which
-- bypasses Row Level Security. We still enable RLS with NO public policies so the
-- public anon key cannot read or write this table.

create table if not exists public.birth_inputs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text,
  birth_date   date not null,         -- local wall-clock date "YYYY-MM-DD"
  birth_time   text not null,         -- local wall-clock time "HH:mm"
  place_label  text,
  place_lat    double precision,
  place_lon    double precision,
  house_system text,
  ayanamsa     text
);

-- Most recent submissions first.
create index if not exists birth_inputs_created_at_idx
  on public.birth_inputs (created_at desc);

-- De-duplication: the "same person" = same name + birth date + birth time + exact
-- coordinates. This UNIQUE index makes a repeat submission a no-op (the code upserts
-- with ON CONFLICT DO NOTHING), and guarantees it even under concurrent requests.
-- House system / ayanamsa are NOT part of the key — they're display settings, so
-- re-generating the same person with a different setting won't create a duplicate.
-- NOTE: if the table already contains duplicate rows, this will fail to create until
-- you remove them (see the dedup query in docs/SUPABASE.md).
create unique index if not exists birth_inputs_identity_idx
  on public.birth_inputs (name, birth_date, birth_time, place_lat, place_lon);

-- Lock the table down to the service_role only. With RLS enabled and no policies,
-- the anon/public key gets zero access; the server's service_role key still works
-- because it bypasses RLS entirely.
alter table public.birth_inputs enable row level security;
