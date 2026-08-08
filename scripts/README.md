# `backfill-dynamo.ts` — Upstash → DynamoDB backfill

Copies the web app's Upstash state into the shared `ctf-leaderboard` DynamoDB
table, and registers every login it sees as a contestant. Two jobs, one run:

1. **Mirror seeding** — before enabling `dual`/`dynamo` mode
   (`CTF_DATA_BACKEND`, see the root README), the mirror expects team, hint,
   and spend items to already exist. This script creates them from the
   authoritative Upstash data.
2. **Contestant registration** — sign-ins that happened before the
   auth-callback hook (`src/lib/auth.ts`) existed never wrote a
   `pk=CONTESTANTS` row, so those players don't appear on `/leaderboard`
   until their first scored PR. Every login this script collects (team
   members, hint spenders, hint buyers) had to be signed in to leave that
   trace, so each one also gets a contestant registry item.

## What it writes

| Item | Source (Upstash) | Write mode |
|------|------------------|------------|
| `pk=TEAMS sk=TEAM#<slug>` | `ctf:team:<slug>` + `:members` | overwrite |
| `pk=USER#<login> sk=PROFILE` | team membership | overwrite |
| `pk=HINTSPEND sk=AUTHOR#<login>` | `ctf:hints:spent` | overwrite |
| `pk=USER#<login> sk=HINT#<app>#<id>` | `ctf:user:<login>:hints` | overwrite |
| `pk=HINTS sk=HINT#<app>#<id>` | scorer-seeded `hints:<app>` | overwrite |
| `pk=CONTESTANTS sk=AUTHOR#<login>` | union of all logins above **plus** logins traced in DynamoDB itself (`TEAMS` members, `HINTSPEND`, `USER#` profiles — required in `dynamo` mode, where activity never touched Upstash) | **conditional** — `attribute_not_exists(pk)` |

The contestant rows are the one exception to the overwrite idiom: the auth
hook owns that partition and first-sign-in-wins is the contract, so a
backfill re-run skips (and logs) every login that is already registered
rather than moving its `registeredAt`. Scored players get registry rows too;
that's harmless — the leaderboard overlay (`src/lib/leaderboard/registered.ts`)
dedupes against scored entries.

Never writes to the scorer-owned partitions (`pk=LEADERBOARD`,
`pk=AUTHOR#<login>`).

## Prerequisites

- **Upstash (read-only)**: `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` in the environment or `.env.local`
  (`vercel env pull` puts them there).
- **AWS**: credentials via the SDK default chain — `aws sso login` plus
  `AWS_PROFILE`. Needed for `--apply`, and now for the dry run too:
  contestant collection reads the table (read-only) so it works in
  `dynamo` mode, where team/hint traces never reached Upstash.
- Table/region default to `ctf-leaderboard` / `us-west-2`; override with
  `CTF_DYNAMO_TABLE` / `CTF_AWS_REGION`.

## Running it

```bash
# 1. Dry run (default): read-only against Upstash, prints every item it
#    would write plus per-category counts. Nothing is written anywhere.
pnpm backfill:dynamo

# 2. Apply: same collection, then writes to DynamoDB.
aws sso login --profile AWSAdministratorAccess-942548380662
AWS_PROFILE=AWSAdministratorAccess-942548380662 pnpm backfill:dynamo --apply

# Mid-contest: register pre-hook sign-ins WITHOUT touching live data.
# Drops every overwrite item and writes only the conditional pk=CONTESTANTS
# rows, which are additive by construction.
AWS_PROFILE=AWSAdministratorAccess-942548380662 pnpm backfill:dynamo --contestants-only --apply
```

Read the dry run before applying — sanity-check the `teams:`, `hint spend
rows:`, and `contestants:` counts against what you expect, and eyeball the
printed items. On apply, expect `skip pk/sk (already registered)` lines for
contestants the auth hook beat you to; the final summary separates items
written from skips.

## When to re-run

- After the scorer re-seeds hint text (`hints:<app>` hashes) — `dynamo` mode
  serves hint text from `pk=HINTS`, and a stale copy means new hints don't
  show.
- After discovering pre-hook sign-ins that should appear on the leaderboard.
- Safe to re-run any time: overwrites converge on current Upstash state, and
  contestant rows are never clobbered. The one caveat: once `dynamo` mode is
  authoritative and teams have diverged from Upstash, an `--apply` would drag
  team/profile items back to the stale Upstash view — check drift first.
- **While the contest is live, prefer `--contestants-only`**: the full run's
  overwrite items race against in-flight team/hint writes (a spend total
  collected from Upstash moments ago can land on top of a purchase that just
  happened), while contestant rows cannot conflict with anything.
