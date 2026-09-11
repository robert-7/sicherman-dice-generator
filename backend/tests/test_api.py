import app.main as main
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generate_endpoint():
    response = client.post("/api/generate", json={"dice": 2, "faces": 6})
    assert response.status_code == 200
    payload = response.json()
    assert payload["solution_count"] == 2
    assert payload["non_standard_solution_count"] == 1
    assert payload["elapsed_ms"] >= 0


def test_input_bounds_are_explicit():
    response = client.post("/api/generate", json={"dice": 5, "faces": 6})
    assert response.status_code == 422


def test_generator_value_error_maps_to_422(monkeypatch):
    # Pydantic's Field bounds mirror the generator's own bounds, so the request
    # validation normally rejects bad input before the endpoint runs. Force the
    # generator to raise so the defensive ValueError -> 422 mapping is exercised.
    def boom(dice, faces):
        raise ValueError("nope")

    monkeypatch.setattr(main, "generate_solutions", boom)
    response = client.post("/api/generate", json={"dice": 2, "faces": 6})
    assert response.status_code == 422
    assert response.json()["detail"] == "nope"
