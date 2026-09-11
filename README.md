# Sicherman Lab 🎲

A modern full-stack generator for **generalized Sicherman dice**: collections of equally-sided dice with positive-integer labels whose sum distribution is exactly the same as ordinary dice labeled `1..s`.

For the classic pair of D6s, the unique non-standard solution is:

- `1, 2, 2, 3, 3, 4`
- `1, 3, 4, 5, 6, 8`

The project generalizes the same polynomial-factorization argument to a configurable number of dice and faces.

## How it works

A standard `s`-sided die has generating polynomial

```text
R_s(x) = x + x² + ... + xˢ
       = x · ∏ Φ_d(x),  d | s, d > 1.
```

For `n` ordinary dice, the sum distribution is encoded by `R_s(x)^n`. By unique factorization, every alternative die polynomial must redistribute the available `x` and cyclotomic factors.

Because labels must be positive, every die must contribute exactly one factor of `x`. We enumerate the remaining cyclotomic-factor allocations, retain only polynomials with non-negative integer coefficients and exactly `s` faces, then find unordered `n`-tuples whose factor exponents add back to the target. Matching the product means matching the entire sum distribution coefficient-for-coefficient.

This is the same method used in Robert Lech's *Proof on the Uniqueness of the Sicherman Dice*, extended algorithmically to arbitrary supported `n` and `s`.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI + SymPy
- **Tests:** Pytest
- **Local orchestration:** Docker Compose

## Run locally

### Docker Compose

```bash
docker compose up --build
```

Then open <http://localhost:3000>. Nginx serves the frontend and proxies `/api` to the FastAPI service.

### Without Docker

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

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

```bash
PYTHONPATH=backend pytest backend/tests

cd frontend
npm run lint          # ESLint (type-aware)
npm run format:check  # Prettier
npm run typecheck     # tsc --noEmit
npm run build         # typecheck + production build
```

Use `npm run lint:fix` and `npm run format` to auto-fix. These frontend checks
also run via pre-commit (locally) and the `frontend` CI job.

## Mathematical references

- Robert Lech, *Proof on the Uniqueness of the Sicherman Dice* (source material in `robert-7/math-assignments-and-presentations`)
- Standard cyclotomic-polynomial derivation of Sicherman dice

## License

MIT
