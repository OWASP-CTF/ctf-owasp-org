# OWASP CTF @ DEF CON 34

The contestant-facing web app for the OWASP Capture The Flag competition at DEF CON 34 (August 7–9, 2026, Las Vegas Convention Center). The DC34 theme is **Agency**.

Contestants patch real vulnerabilities in six deliberately-insecure OWASP training apps and submit the fix as a GitHub pull request. A CI scorer validates each patch and pushes results to the leaderboard — no flag submission, no manual grading.

## Status

Pre-event. Core site, GitHub sign-in, leaderboard, profile, and team UI are built. The leaderboard currently renders illustrative mock data — it switches to live contestant results once the CTF backend is wired up and the event starts (see the countdown on the homepage and the notice on `/leaderboard`).

## Features

- **GitHub sign-in** ([better-auth](https://www.better-auth.com/)) — contestants authenticate with the same GitHub account they open pull requests from.
- **Leaderboard** (`/leaderboard`) — public standings; sign in to highlight your own row. Backed by a swappable data-source adapter (see below).
- **Profile** (`/profile`) — gated per-challenge progress across all six target apps.
- **Teams** — join, create, or leave a team (currently backed by a per-browser cookie; real persistence lands with the production backend).
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
| `LEADERBOARD_API_URL` | Only if `LEADERBOARD_SOURCE=lambda` | Base URL of the scoring Lambda |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Only if `LEADERBOARD_SOURCE=upstash` | Upstash Redis REST credentials (read-only token is sufficient for reads) |
| `TEAM_WRITES_ENABLED` | No | Enables real team-write persistence once a backend is available; unset uses the per-browser cookie mock |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | Run ESLint |

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
    apps.ts                   # Metadata for the six target apps
    site.ts                   # Event dates, nav links
    leaderboard/               # Data-source adapters (mock/lambda/upstash) + types
    team-store.ts              # Team read/write abstraction
public/
  owasp-logo.png              # OWASP logo (rendered inverted on dark backgrounds)
```

## Leaderboard Data Sources

`LEADERBOARD_SOURCE` swaps the backend without touching any UI code:

- **`mock`** (default) — local fixture shaped like the target production API. Used everywhere until the real backend is ready.
- **`lambda`** — reads the deployed scoring Lambda's `/leaderboard` endpoint.
- **`upstash`** — reads directly from Upstash Redis via its REST API.

## Branding

- **OWASP**: Logo and favicon sourced from the official mark at [owasp.org](https://owasp.org); typography follows the [OWASP Brand Guidelines 2024](https://policy.owasp.org/operational/branding)
- **DEF CON 34**: Dark blue-gray palette (`#1a1a2e`), accent colors (red, yellow, blue, teal) inspired by the [DC34 theme page](https://defcon.org/html/defcon-34/dc-34-theme.html)
