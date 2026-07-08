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
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Only if `LEADERBOARD_SOURCE=upstash` or `TEAM_WRITES_ENABLED=true` | Upstash Redis REST credentials (leaderboard reads work with a read-only token; team writes need a **read/write** token) |
| `TEAM_WRITES_ENABLED` | No | `true` persists team join/create/leave to Upstash Redis; unset uses the per-browser cookie mock |

> Env var changes on Vercel only take effect on the **next deployment** — redeploy after adding or changing one.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the vitest suite (team-store unit tests; the live-Upstash integration tests auto-skip without `UPSTASH_REDIS_REST_*` credentials) |

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
  components/                 # Site header/footer, leaderboard, team card,
                               # event countdown, challenge lists, etc.
  lib/
    auth.ts / auth-client.ts  # better-auth server + client config
    apps.ts                   # Metadata for the six target apps (static fallback counts)
    challenges.ts              # Live challenge catalogue from the scoring API
    site.ts                   # Event dates, nav links
    leaderboard/               # Data-source adapters (mock/lambda/upstash) + types
    upstash.ts                 # Shared Upstash Redis REST client (pipeline + EVAL)
    team-store.ts              # Team reads/writes (Upstash or cookie mock)
    __tests__/                 # vitest: team rules (unit + live-Upstash integration)
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

## Branding

- **OWASP**: Logo and favicon sourced from the official mark at [owasp.org](https://owasp.org); typography follows the [OWASP Brand Guidelines 2024](https://policy.owasp.org/operational/branding)
- **DEF CON 34**: Dark blue-gray palette (`#1a1a2e`), accent colors (red, yellow, blue, teal) inspired by the [DC34 theme page](https://defcon.org/html/defcon-34/dc-34-theme.html)
