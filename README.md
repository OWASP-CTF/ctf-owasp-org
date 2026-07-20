# OWASP CTF @ DEF CON 34

The contestant-facing web app for the OWASP Capture The Flag competition at DEF CON 34 (August 7–9, 2026, Las Vegas Convention Center). The DC34 theme is **Agency**.

Contestants patch real vulnerabilities in six deliberately-insecure OWASP training apps and submit the fix as a GitHub pull request. A CI scorer validates each patch and pushes results to the leaderboard — no flag submission, no manual grading.

## Status

Pre-event, backend wired up. Core site, GitHub sign-in, leaderboard, profile, and teams are built. Production reads live scoring data from the Lambda (`LEADERBOARD_SOURCE=lambda`) and team membership persists to Upstash Redis when `TEAM_WRITES_ENABLED=true`; without those env vars everything falls back to mock data so the site stays fully demoable with zero backend.

## Features

- **GitHub sign-in** ([better-auth](https://www.better-auth.com/)) — contestants authenticate with the same GitHub account they open pull requests from.
- **Leaderboard** (`/leaderboard`) — public standings; sign in to highlight your own row. Backed by a swappable data-source adapter (see below).
- **Profile** (`/profile`) — gated per-app progress across all six target apps.
- **Teams** — join, create, or leave a team of up to **4 players**. Writes go to Upstash Redis and are entirely server-side (see below); without `TEAM_WRITES_ENABLED` they fall back to a per-browser cookie mock (flagged with a "mock mode" badge).
- **Paid hints** (`/challenges`) — signed-in contestants can reveal a hint for any challenge at a flat **−10 points**, deducted from their leaderboard score (see below). Signed-out visitors see a locked teaser. Off until `HINTS_ENABLED=true` — flip it when the event starts.
- **Six real targets** — Juice Shop, DVWA, WebGoat, Security Shepherd, VulnerableApp, and VAmPI, covering the OWASP Web and API Top 10.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, TypeScript)
- **Auth**: [better-auth](https://www.better-auth.com/) (stateless/cookie sessions, GitHub OAuth)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4 — see `DESIGN_SYSTEM.md` for tokens and component patterns
- **Fonts**: Poppins (headings) + Barlow (body) per [OWASP brand guidelines](https://policy.owasp.org/operational/branding)
- **Package manager**: [pnpm](https://pnpm.io/)
- **Hosting**: [Vercel](https://vercel.com/)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Environment variables

Copy `.env.example` to `.env.local` and fill in real values — none of these should ever be committed.

| Variable | Required | Purpose |
|---|---|---|
| `BETTER_AUTH_SECRET` | Yes | Session cookie signing/encryption key (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | Base URL of the app (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app credentials — create one under the org's GitHub settings with callback `<BETTER_AUTH_URL>/api/auth/callback/github` |
| `LEADERBOARD_SOURCE` | No | `mock` (default) \| `lambda` \| `upstash` — selects the leaderboard data adapter |
| `LEADERBOARD_API_URL` | Only if `LEADERBOARD_SOURCE=lambda` | Base URL of the scoring API — serves `/leaderboard` (used by the lambda source) and `/challenges` (live challenge catalogue on the challenges page; without it the page shows static fallback cards) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Only if `LEADERBOARD_SOURCE=upstash`, `TEAM_WRITES_ENABLED=true`, or `HINTS_ENABLED=true` | Upstash Redis REST credentials (leaderboard reads work with a read-only token; team writes and hint purchases need a **read/write** token) |
| `TEAM_WRITES_ENABLED` | No | `true` persists team join/create/leave to Upstash Redis; unset uses the per-browser cookie mock |
| `HINTS_ENABLED` | No | `true` turns on paid hints on `/challenges` (needs the Upstash vars). Leave unset until the event so contestants can't buy hints early |
| `CTF_DATA_BACKEND` | No | Which store backs team + hint state: `dual` (default) writes Upstash as the source of truth and mirrors into DynamoDB, `upstash` disables the DynamoDB side, `dynamo` makes DynamoDB the only store — see [DynamoDB migration](#dynamodb-migration) |
| `CTF_AWS_REGION` / `AWS_ROLE_ARN` / `CTF_DYNAMO_TABLE` | No | DynamoDB overrides — working defaults are hardcoded in `src/lib/dynamo.ts`, normally leave unset. (`CTF_AWS_REGION` on purpose, not `AWS_REGION` — Vercel injects the latter with the function's own execution region) |

> Env var changes on Vercel only take effect on the **next deployment** — redeploy after adding or changing one.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the vitest suite (team + hint store unit tests; the live-Upstash and live-DynamoDB integration suites auto-skip without `UPSTASH_REDIS_REST_*` credentials / `AWS_PROFILE`) |
| `pnpm backfill:dynamo` | Copy existing Upstash team/hint state into DynamoDB (dry run; add `--apply` to write) — run once before enabling the mirror in prod |

## Project Structure

```
src/
  app/
    page.tsx                 # Homepage: hero, countdown, "what to expect", targets
    layout.tsx                # Root layout, fonts, metadata
    (site)/
      how-to-play/            # Contestant workflow guide
      challenges/              # Target app browser
      rules/                   # Competition rules
      leaderboard/              # Public standings
      profile/                  # Gated per-contestant dossier
      faq/                      # FAQ
    api/
      auth/[...all]/            # better-auth route handler
      team/                     # Join/create/leave team routes
      hints/                    # Viewer hint state + paid reveal routes
  components/                 # Site header/footer, leaderboard, team card,
                               # event countdown, challenge lists, etc.
  lib/
    auth.ts / auth-client.ts  # better-auth server + client config
    apps.ts                   # Metadata for the six target apps (static fallback counts)
    challenges.ts              # Live challenge catalogue from the scoring API
    site.ts                   # Event dates, nav links
    leaderboard/               # Data-source adapters (mock/lambda/upstash) + types
    upstash.ts                 # Shared Upstash Redis REST client (pipeline + EVAL)
    team-store.ts              # Team reads/writes (backend dispatch, Lua scripts, cookie mock)
    hint-store.ts              # Paid hint purchases + penalty reads (backend dispatch)
    dynamo.ts                  # DynamoDB client/config + the CTF_DATA_BACKEND flag
    dynamo-shapes.ts           # pk/sk builders + item shapes for the shared table
    dynamo-team-store.ts       # Team rules as conditional DynamoDB transactions
    dynamo-hint-store.ts       # Hint charge-once + penalty reads on DynamoDB
    __tests__/                 # vitest: team + hint rules (unit + live integration)
public/
  owasp-logo.png              # OWASP logo (rendered inverted on dark backgrounds)
```

## Leaderboard Data Sources

`LEADERBOARD_SOURCE` swaps the backend without touching any UI code:

- **`mock`** (default) — local fixture shaped like the target production API. Used everywhere until the real backend is ready.
- **`lambda`** — reads the deployed scoring Lambda's `/leaderboard` endpoint (per-app solved/total; unsolved challenges count as *remaining*, not *failed*).
- **`upstash`** — reads directly from Upstash Redis via its REST API.

## Teams

Team membership lives in Upstash Redis when `TEAM_WRITES_ENABLED=true`. All writes are server-side only: the `/api/team*` route handlers derive the player's GitHub login from the better-auth session, and the only client input (team name/slug) is slugified and length-capped before touching Redis — nothing client-side can forge identity or bypass the rules.

Rules, enforced atomically (each mutation is a single Lua `EVAL`, so they can't be raced):

- **Max 4 players per team** — the fifth join is rejected with "team is full".
- **One team per player** — joining or creating while already on a team is rejected until you leave.
- Duplicate team slugs are rejected; joining a nonexistent team is rejected; a team's keys are deleted when its last member leaves.

Schema:

```
HSET ctf:team:<slug> name <name> captain <login> createdAt <iso>
SADD ctf:team:<slug>:members <login>     # capped at 4
HSET ctf:user:<login> team <slug>
```

These rules are covered by `pnpm test` — unit tests with Upstash mocked, plus an integration suite that runs the real Lua scripts against live Upstash using throwaway keys.

## Hints

Hint text lives in the scorer-owned Upstash hashes `hints:<app>` (field = challenge catalogue id, value = hint text). When `HINTS_ENABLED=true` (and the `UPSTASH_REDIS_REST_*` vars are set), each challenge row on `/challenges` with a hint gets a reveal control: signed-out visitors see a locked teaser, signed-in contestants confirm and pay a flat **10 points** per hint. Re-viewing a bought hint is always free — charging is idempotent inside a single Lua `EVAL` (a double-click or race can't charge twice), and it's keyed by the server-derived session login, so nothing client-side can spend someone else's points.

Purchases are recorded under the site's `ctf:` namespace, which the scorer never rewrites — penalties survive re-scores:

```
SADD ctf:user:<login>:hints "<app>/<challengeId>"   # what the user bought
HINCRBY ctf:hints:spent <login> 10                  # running penalty total
```

The scorer's `leaderboard` ZSET is never decremented. Instead, displayed scores subtract the penalty as an overlay (`withHintPenalties`, floored at 0) applied **before** `withTeamStandings`, so leaderboard rows, team totals, and the profile all show the same net numbers. Penalized rows carry a small "−N hints" marker for transparency.

## DynamoDB migration

Team and hint state is migrating from Upstash to the `ctf-leaderboard` DynamoDB table (the same table the dc34 scorer dual-writes solves into). `CTF_DATA_BACKEND` controls the cutover — the four write routes and all consumers are unchanged; only the store layer dispatches:

| Value | Writes | Reads |
|---|---|---|
| `dual` (default, incl. unset) | Upstash Lua is the source of truth; every success also runs the equivalent conditional DynamoDB mutation as an awaited best-effort mirror that never throws | Upstash |
| `upstash` | Upstash only — zero AWS calls | Upstash |
| `dynamo` | DynamoDB only, with the same rules enforced as conditional transactions (`TransactWriteItems`) | DynamoDB (hint *text* and availability still come from the scorer-seeded Upstash hashes, so the `UPSTASH_REDIS_REST_*` vars stay required for hints) |

In `dual` mode every mirror outcome is logged as `[dynamo-mirror] …` — a `verdict mismatch` line means the two stores disagree. Soak in `dual`, grep those logs clean, then flip to `dynamo`.

Item shapes in the shared table (scorer partitions `LEADERBOARD` / `AUTHOR#<login>` are never touched):

```
pk=TEAMS          sk=TEAM#<slug>        name, captain, createdAt, members (string set, never empty)
pk=USER#<login>   sk=PROFILE            team (absent = no team)
pk=USER#<login>   sk=HINT#<app>#<id>    one item per hint purchase (the charge-once guard)
pk=HINTSPEND      sk=AUTHOR#<login>     spent — one Query serves the whole leaderboard
pk=HINTS          sk=HINT#<app>#<id>    hint text, copied from the scorer-seeded hints:<app>
                                        hashes by the backfill (not yet read by the app)
```

**Credentials.** On Vercel there are no stored keys: deployments exchange a Vercel OIDC token for the `ctf-web-dynamodb` IAM role (trust + table policy live in the dc34 repo's `terraform/vercel-aws.tf`; the trust covers production + preview only). Locally the SDK default chain is used instead:

```
aws sso login --profile AWSAdministratorAccess-942548380662
AWS_PROFILE=AWSAdministratorAccess-942548380662 pnpm dev
```

**Backfill.** Before enabling the mirror in an environment with existing Upstash data, copy it over once so mirrored joins find their team items: `pnpm backfill:dynamo` (dry run), then `pnpm backfill:dynamo --apply`. Idempotent and read-only against Upstash. It also copies the scorer-seeded `hints:<app>` text hashes into `pk=HINTS`; Upstash remains the authority for hint text, so re-run the backfill after any hint re-seeding.

## Branding

- **OWASP**: Logo and favicon sourced from the official mark at [owasp.org](https://owasp.org); typography follows the [OWASP Brand Guidelines 2024](https://policy.owasp.org/operational/branding)
- **DEF CON 34**: Dark blue-gray palette (`#1a1a2e`), accent colors (red, yellow, blue, teal) inspired by the [DC34 theme page](https://defcon.org/html/defcon-34/dc-34-theme.html)
