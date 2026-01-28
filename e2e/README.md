# E2E Tests (Playwright)

End-to-end tests for Guepard Store. They run against a **running** instance of the app (frontend + API).

## Prerequisites

- Frontend dev server on port 8080
- API dev server on port 4000 (frontend proxies `/api` to it)

Start them before running tests:

```bash
# Terminal 1 – API
cd components/api && pnpm dev

# Terminal 2 – Frontend
cd components/frontend && pnpm dev
```

Or use Docker: `docker-compose up` and ensure the frontend is reachable at http://localhost:8080.

## Install

From this directory:

```bash
pnpm install
pnpm exec playwright install
```

(`playwright install` downloads browser binaries if needed.)

## Run

From this directory:

```bash
pnpm test          # headless
pnpm test:ui       # interactive UI
pnpm test:headed   # headed browser
```

From repo root you can use: `pnpm e2e` (if a root `package.json` with that script exists).
