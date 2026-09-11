# Sicherman Lab 🎲

A modern full-stack generator for **generalized Sicherman dice**: collections of equally-sided dice with positive-integer labels whose sum distribution is exactly the same as ordinary dice labeled `1..s`.

For the classic pair of D6s, the unique non-standard solution is:

- `1, 2, 2, 3, 3, 4`
- `1, 3, 4, 5, 6, 8`

The project generalizes the same polynomial-factorization argument to a configurable number of dice and faces.

## How it works

A standard $s$-sided die has generating polynomial

$$
R_s(x) = x + x^2 + \cdots + x^s = x \prod_{d \mid s,\ d > 1} \Phi_d(x)
$$

For $n$ ordinary dice, the sum distribution is encoded by $R_s(x)^n$. By unique factorization, every alternative die polynomial must redistribute the available $x$ and cyclotomic factors.

Because labels must be positive, every die must contribute exactly one factor of $x$. We enumerate the remaining cyclotomic-factor allocations, retain only polynomials with non-negative integer coefficients and exactly $s$ faces, then find unordered $n$-tuples whose factor exponents add back to the target. Matching the product means matching the entire sum distribution coefficient-for-coefficient.

This is the same method used in Robert Lech's *Proof on the Uniqueness of the Sicherman Dice*, extended algorithmically to arbitrary supported $n$ and $s$.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI + SymPy
- **Unit tests:** Pytest (backend) + Vitest (frontend), 100% coverage enforced
- **End-to-end tests:** Playwright, driven against the Docker Compose stack
- **Local orchestration:** Docker Compose

## Setup

### Prerequisites

- **Docker Compose** (recommended -- no local Node.js or Python needed), or
- **Node.js 24+** and **Python 3.11+** to run the frontend and backend directly

### Quickstart (Docker Compose)

1. From the repo root, build and start both services:

   ```bash
   docker compose up --build
   ```

1. Open <http://localhost:3000>. Nginx serves the frontend and proxies `/api` requests to the
   FastAPI backend.

### Manual setup (without Docker)

1. Start the backend:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements-dev.txt
   uvicorn app.main:app --reload
   ```

1. In a second terminal, start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

1. Open <http://localhost:5173>. Vite's dev server proxies `/api` requests to
   `http://localhost:8000` (see `frontend/vite.config.ts`).

## API

`POST /api/generate`

```json
{
  "dice": 2,
  "faces": 6
}
```

The response contains every unordered solution found, marks the ordinary solution, and includes each die's labels, generating polynomial, and cyclotomic-factor allocation.

## Bounds

The public API currently accepts **1-4 dice** and **2-20 faces per die**. Every result within those bounds is enumerated exhaustively--there is no silent truncation. These are implementation safeguards rather than mathematical restrictions; larger inputs can produce very large solution sets.

## Development checks

### Backend

```bash
# Tests under coverage (gate: 100%, configured in .coveragerc)
PYTHONPATH=backend coverage run -m pytest backend/tests && coverage report
```

### Frontend

```bash
cd frontend
npm run lint          # ESLint (type-aware)
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit
npm run test          # Vitest (watch)
npm run coverage      # Vitest + v8 coverage (gate: 100%)
npm run build         # typecheck + production build
```

Use `npm run lint:fix` and `npm run format` to auto-fix. These frontend checks
also run via pre-commit (locally) and the `frontend` CI job.

### End-to-end (Playwright)

```bash
cd e2e
npm install
npx playwright install --with-deps chromium
npm test
```

`playwright.config.ts` builds and starts the full Docker Compose stack itself, then drives a real
browser against it -- catching integration issues unit tests can't, like a frontend/backend
contract mismatch or a broken nginx proxy rule. Also runs in the `e2e` CI job.

## Test coverage

Both sides of the stack enforce **100%** coverage in CI, and a drop fails the
build:

- **Backend:** measured by [coverage.py](https://coverage.readthedocs.io);
  `fail_under = 100` lives in `.coveragerc`. The pre-commit `pytest` hook and the
  `coverage` CI job both enforce it. Genuinely unreachable defensive code is
  marked with `# pragma: no cover` and explained inline.
- **Frontend:** measured by Vitest's v8 provider; the 100% thresholds live in
  `vite.config.ts` and run in the `frontend` CI job. The app bootstrap
  (`main.tsx`) and type-only modules are excluded from measurement.

The Playwright suite is a separate integration/smoke layer against the real stack and isn't part
of the coverage gate.

## Mathematical references

- Robert Lech, *Proof on the Uniqueness of the Sicherman Dice* (source material in `robert-7/math-assignments-and-presentations`)
- Standard cyclotomic-polynomial derivation of Sicherman dice

## License

MIT
