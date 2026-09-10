from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import cast
from typing import Iterable

from sympy import cyclotomic_poly
from sympy import divisors
from sympy import factorint
from sympy import Poly
from sympy import Symbol

x = Symbol("x")


@dataclass(frozen=True)
class DieCandidate:
    exponents: tuple[int, ...]
    labels: tuple[int, ...]
    coefficients: tuple[int, ...]

    @property
    def max_label(self) -> int:
        return self.labels[-1]


def _factor_value_at_one(d: int) -> int:
    return int(cast(int, cyclotomic_poly(d, x).subs(x, 1)))


@lru_cache(maxsize=128)
def _factor_coefficients(d: int) -> tuple[int, ...]:
    poly = Poly(cyclotomic_poly(d, x), x)
    degree = cast(int, poly.degree())
    return tuple(int(cast(int, poly.nth(i))) for i in range(degree + 1))


def _convolve(a: tuple[int, ...], b: tuple[int, ...]) -> tuple[int, ...]:
    out = [0] * (len(a) + len(b) - 1)
    for i, ai in enumerate(a):
        if ai == 0:
            continue
        for j, bj in enumerate(b):
            if bj:
                out[i + j] += ai * bj
    return tuple(out)


def _poly_pow(base: tuple[int, ...], exponent: int) -> tuple[int, ...]:
    result = (1,)
    power = base
    e = exponent
    while e:
        if e & 1:
            result = _convolve(result, power)
        e >>= 1
        if e:
            power = _convolve(power, power)
    return result


def _candidate_polynomial(ds: tuple[int, ...], exponents: tuple[int, ...]) -> tuple[int, ...]:
    # Every legal die has exactly one x factor: if all labels are positive, each
    # die contributes at least one x, while the target contains exactly x^dice.
    coeffs: tuple[int, ...] = (0, 1)
    for d, exponent in zip(ds, exponents):
        if exponent:
            coeffs = _convolve(coeffs, _poly_pow(_factor_coefficients(d), exponent))
    return coeffs


def _labels_from_coefficients(coefficients: tuple[int, ...]) -> tuple[int, ...] | None:
    if coefficients[0] != 0 or any(c < 0 for c in coefficients):
        return None
    labels: list[int] = []
    for value, count in enumerate(coefficients):
        if value == 0:
            continue
        labels.extend([value] * count)
    return tuple(labels)


def _enumerate_exponent_vectors(dice: int, faces: int, ds: tuple[int, ...]) -> Iterable[tuple[int, ...]]:
    face_prime_factors = factorint(faces)
    prime_keys = tuple(sorted(face_prime_factors))
    target = tuple(face_prime_factors[p] for p in prime_keys)

    contributions: list[tuple[int, ...]] = []
    for d in ds:
        value = _factor_value_at_one(d)
        vf = factorint(value)
        contributions.append(tuple(vf.get(p, 0) for p in prime_keys))

    suffix_max: list[tuple[int, ...]] = [(0,) * len(prime_keys) for _ in range(len(ds) + 1)]
    for i in range(len(ds) - 1, -1, -1):
        suffix_max[i] = tuple(
            suffix_max[i + 1][j] + dice * contributions[i][j]
            for j in range(len(prime_keys))
        )

    current = [0] * len(ds)

    def rec(i: int, used: tuple[int, ...]):
        if i == len(ds):
            if used == target:
                yield tuple(current)
            return

        contrib = contributions[i]
        for exponent in range(dice + 1):
            nxt = tuple(used[j] + exponent * contrib[j] for j in range(len(prime_keys)))
            if any(nxt[j] > target[j] for j in range(len(prime_keys))):
                break
            if any(nxt[j] + suffix_max[i + 1][j] < target[j] for j in range(len(prime_keys))):
                continue
            current[i] = exponent
            yield from rec(i + 1, nxt)

    yield from rec(0, (0,) * len(prime_keys))


def enumerate_candidates(dice: int, faces: int) -> tuple[tuple[int, ...], list[DieCandidate]]:
    ds = tuple(d for d in divisors(faces) if d > 1)
    candidates: list[DieCandidate] = []

    for exponents in _enumerate_exponent_vectors(dice, faces, ds):
        coefficients = _candidate_polynomial(ds, exponents)
        labels = _labels_from_coefficients(coefficients)
        if labels is None or len(labels) != faces:
            continue
        candidates.append(DieCandidate(exponents, labels, coefficients))

    candidates.sort(key=lambda c: (c.labels, c.exponents))
    return ds, candidates


def _standard_exponents(ds: tuple[int, ...]) -> tuple[int, ...]:
    return tuple(1 for _ in ds)


def generate_solutions(dice: int, faces: int) -> dict:
    if not 1 <= dice <= 4:
        raise ValueError("dice must be between 1 and 4")
    if not 2 <= faces <= 20:
        raise ValueError("faces must be between 2 and 20")

    ds, candidates = enumerate_candidates(dice, faces)
    target = tuple(dice for _ in ds)
    solutions: list[tuple[int, ...]] = []
    # Backtracking over candidate indices in nondecreasing order gives unordered
    # multisets of dice exactly once.
    def search(start: int, slots: int, remaining: tuple[int, ...], chosen: list[int]) -> None:
        if slots == 0:
            if all(v == 0 for v in remaining):
                solutions.append(tuple(chosen))
            return

        for idx in range(start, len(candidates)):
            exps = candidates[idx].exponents
            if any(exps[j] > remaining[j] for j in range(len(ds))):
                continue

            nxt = tuple(remaining[j] - exps[j] for j in range(len(ds)))
            if slots == 1 and any(nxt):
                continue
            if any(v > (slots - 1) * dice for v in nxt):
                continue

            chosen.append(idx)
            search(idx, slots - 1, nxt, chosen)
            chosen.pop()

    search(0, dice, target, [])

    standard = _standard_exponents(ds)
    serialized = []
    for indices in solutions:
        dice_payload = []
        is_standard = True
        for idx in indices:
            candidate = candidates[idx]
            if candidate.exponents != standard:
                is_standard = False
            dice_payload.append(
                {
                    "labels": list(candidate.labels),
                    "max_label": candidate.max_label,
                    "polynomial": polynomial_to_string(candidate.coefficients),
                    "cyclotomic_exponents": {str(d): e for d, e in zip(ds, candidate.exponents) if e},
                }
            )
        serialized.append({"dice": dice_payload, "is_standard": is_standard})

    non_standard = sum(not solution["is_standard"] for solution in serialized)
    return {
        "dice": dice,
        "faces": faces,
        "cyclotomic_divisors": list(ds),
        "canonical_polynomial": canonical_polynomial_string(faces),
        "factorization": canonical_factorization_string(faces, ds),
        "candidate_die_count": len(candidates),
        "solution_count": len(serialized),
        "non_standard_solution_count": non_standard,
        "solutions": serialized,
    }


def canonical_polynomial_string(faces: int) -> str:
    return " + ".join("x" if i == 1 else f"x^{i}" for i in range(1, faces + 1))


def canonical_factorization_string(faces: int, ds: tuple[int, ...] | None = None) -> str:
    ds = ds or tuple(d for d in divisors(faces) if d > 1)
    factors = " ".join(f"Φ_{d}(x)" for d in ds)
    return f"x {factors}" if factors else "x"


def polynomial_to_string(coefficients: tuple[int, ...]) -> str:
    terms: list[str] = []
    for exponent in range(len(coefficients) - 1, -1, -1):
        coefficient = coefficients[exponent]
        if coefficient == 0:
            continue
        sign = "+" if coefficient > 0 else "-"
        magnitude = abs(coefficient)
        if exponent == 0:
            body = str(magnitude)
        elif exponent == 1:
            body = "x" if magnitude == 1 else f"{magnitude}x"
        else:
            body = f"x^{exponent}" if magnitude == 1 else f"{magnitude}x^{exponent}"
        if not terms:
            terms.append(body if coefficient > 0 else f"-{body}")
        else:
            terms.append(f" {sign} {body}")
    return "".join(terms) or "0"
