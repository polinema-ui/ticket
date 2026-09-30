<h1 align="center">Polinema Ticket</h1>

<br />

<div align="center">
  <img src="static/logo.png" height="60" alt="Polinema Ticket Mark" />
</div>

<br />

<p align="center">
  Lightweight GitHub PR & ticketing workflow — auto-link issues to pull requests, triage tickets, and track progress with email notifications. Built for the Polinema UI PBL ecosystem.
</p>

## Overview

Polinema Ticket connects GitHub issues and pull requests with a streamlined ticketing portal. Create tickets via structured issue templates (Bug Report, Component Request), auto-sync PR status via webhooks, and keep reporters in the loop through automated email notifications — all without leaving your development flow.

Designed as a companion to [Polinema UI](https://github.com/polinema-ui/p-ui), the app adapts the same copy-and-paste, multi-ecosystem PBL architecture to project management for polytechnic lab workflows.

## Core Features

| Feature                    | Description                                                                                                     |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **GitHub Issue Templates** | Structured `.yml` forms for Bug Report & Component Request with unified reusable fields (email, versions, etc.). |
| **Repo-Aware Issues Page** | Filter issues by repository (`polinema-ui/p-ui`, `polinema-ui/ticket`) — dynamic count & sidebar per repo.      |
| **Pixel-Swap Loader**      | Canvas-based pixel dissolve transition (blue → white, scale + random stagger) — zero clone overhead.             |
| **Email Notifications**    | Collect reporter email on issue create; dispatch progress updates on PR link, assign, review, and merge/close.  |
| **Ticketing Workflow**     | Auto-link PRs to issues, triage by `status` × `priority` × `category`, and track with labels & milestones.      |
| **Light/Dark Ready**       | Lightmode-first (`#fbfcf8` canvas, blue `→` green selection) with dark `Html` class opt-in.                     |

## Tech Stack

- **Core Framework:** SvelteKit (Svelte 5 Runes API)
- **Styling Engine:** Tailwind CSS v4 & Tailwind Typography/Forms
- **Icons:** @hugeicons/core-free-icons + @hugeicons/svelte
- **Utilities:** tailwind-merge / clsx / class-variance-authority
- **Validation & Testing:** Vitest (Unit) & Playwright (E2E)
- **Code Quality:** ESLint, Prettier, and `no-restricted-imports` (`@/api`, `@/lib`)
- **Deploy Target:** Vercel (`@sveltejs/adapter-vercel` — SSR notes respected, not refetched)

## Getting Started

### Prerequisites

- Node.js (v18+) or Bun runtime
- Package manager (`bun`, `pnpm`, or `npm`)

### Local Setup

```bash
# Clone the repository
git clone https://github.com/polinema-ui/ticket.git
cd ticket

# Install dependencies
bun install

# Start local development server
bun run dev
```

Open `http://localhost:5173` in your browser.

## Verification Scripts

Execute these validation commands before committing changes:

| Command             | Action                                                                   |
| :------------------ | :----------------------------------------------------------------------- |
| `bun run check`     | Syncs SvelteKit types and verifies TypeScript + Svelte type correctness. |
| `bun run lint`      | Audits code formatting (Prettier) and code style rules (ESLint).         |
| `bun run format`    | Automatically formats the entire codebase.                               |
| `bun run test:unit` | Executes unit tests via Vitest.                                          |
| `bun run test:e2e`  | Executes end-to-end tests via Playwright.                                |
| `bun run build`     | Creates an optimized production build.                                    |
| `bun run preview`   | Previews the production build locally.                                    |

## Project Structure

```text
├── .github/ISSUE_TEMPLATE/ # Bug report & component request (.yml) + config.yml
├── src/
│   ├── app/                # Path alias wrappers (@/app/paths, @/app/navigation)
│   ├── lib/
│   │   ├── assets/         # Logo & background imagery
│   │   ├── components/
│   │   │   ├── atoms/      # Pixel-swap loader, tech-text animation
│   │   │   ├── hero/       # Navbar, hero-intro, hero-grid
│   │   │   ├── navbar/     # App header with GitHub stars badge
│   │   │   └── ui/         # Button, badge primitives
│   │   ├── data/           # Issue templates, ticket & hero-card datasets
│   │   ├── types/          # Ticket, hero, icon type definitions
│   │   └── utils/          # cn helper (clsx + tailwind-merge)
│   └── routes/
│       ├── api/            # /api/github-stars, /api/github-issues (org fetch, .github filtered)
│       └── tickets/        # Issues listing (repo selector, search, labels, assignees)
├── static/                 # Favicon & public assets
├── svelte.config.js        # @ → src alias
└── vite.config.ts          # sveltekit() runner (no raw adapter injection)
```

## Contributing

Contributions are welcome! Please open an issue using one of the provided templates before submitting a pull request.

## Maintainers

- [@a6iyyu](https://github.com/a6iyyu)
- [@ckckckcz](https://github.com/ckckckcz)

## License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for details.
