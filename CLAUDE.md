# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A full-stack generator for generalized Sicherman dice: a FastAPI + SymPy backend enumerates
solutions, a React + TypeScript + Vite frontend presents them. See `README.md` for the math and
the API contract.

## Commands

```bash
# Backend unit tests under coverage (gate: 100%, configured in .coveragerc)
PYTHONPATH=backend coverage run -m pytest backend/tests && coverage report

# Frontend lint, format check, type check, unit tests, and production build
cd frontend && npm run lint && npm run format:check && npm run typecheck && npm run coverage && npm run build

# All local linting/formatting/tests via pre-commit (skips the frontend hooks --
# those need `npm install` in frontend/ first; CI enforces them separately)
pre-commit run --all-files

# End-to-end tests (Playwright, drives a real browser against the full Docker
# Compose stack -- playwright.config.ts builds and starts it automatically)
cd e2e && npm install && npx playwright install --with-deps chromium && npm test

# Bring up the full stack in Docker (frontend on :3000, proxies /api to backend)
docker compose up --build
```

**Before marking any task complete**, run the backend tests, the frontend checks, and
`pre-commit run --all-files`; fix any failures. Both backend and frontend enforce 100% coverage --
see the "Test coverage" section of `README.md` for what that gate covers and how to mark
genuinely-unreachable code with `# pragma: no cover`. If you touched frontend/backend integration
behavior (API contract, nginx proxy, request/response shape), also run the Playwright suite.

## Architecture

- `backend/app/generator.py` -- the actual math: enumerates cyclotomic-factor allocations across
  dice via `sympy`, filters to valid label multisets, and searches for solutions. Read this before
  changing enumeration or bounds logic.
- `backend/app/main.py` -- the single FastAPI route (`POST /api/generate`) and its request/response
  shape.
- `frontend/src/App.tsx` -- the whole UI: form, results, and the collapsible math explainer.
- `e2e/` -- Playwright suite; a separate npm project (its own `package.json`), not part of
  `frontend/`. It exercises the built Docker images, not the Vite dev server, so it also catches
  nginx proxy and production-build regressions that frontend unit tests can't.
