from __future__ import annotations

from time import perf_counter

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .generator import generate_solutions

app = FastAPI(
    title="Sicherman Dice Generator API",
    description="Enumerate positive-integer relabelings of equally-sided dice with the canonical sum distribution.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    dice: int = Field(default=2, ge=1, le=4)
    faces: int = Field(default=6, ge=2, le=20)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/generate")
def generate(request: GenerateRequest) -> dict:
    started = perf_counter()
    try:
        result = generate_solutions(request.dice, request.faces)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    result["elapsed_ms"] = round((perf_counter() - started) * 1000, 2)
    return result
