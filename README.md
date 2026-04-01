# OWASP CTF @ DEF CON 34

A web application for the OWASP Capture The Flag competition at DEF CON 34 (August 6-9, 2026, Las Vegas Convention Center). The DC34 theme is **Agency**.

## Status

Currently showing a **Coming Soon** placeholder page. The CTF challenges and platform are under development.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4
- **Fonts**: Poppins (headings) + Barlow (body) per [OWASP brand guidelines](https://policy.owasp.org/operational/branding)
- **Hosting**: [Vercel](https://vercel.com/)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
  app/
    layout.tsx    # Root layout, metadata, font loading
    page.tsx      # Coming Soon landing page
    globals.css   # Tailwind imports, CSS variables, animations
public/
  owasp-logo.png  # OWASP logo (rendered inverted for dark background)
```

## Branding

- **OWASP**: Logo sourced from [owasp.org](https://owasp.org), typography follows the [OWASP Brand Guidelines 2024](https://policy.owasp.org/operational/branding)
- **DEF CON 34**: Dark blue-gray palette (`#1a1a2e`), accent colors (red, yellow, blue, teal) inspired by the [DC34 theme page](https://defcon.org/html/defcon-34/dc-34-theme.html)
