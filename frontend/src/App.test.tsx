import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App";
import type { Die, GenerateResponse } from "./types";

function die(labels: number[]): Die {
  return {
    labels,
    max_label: labels[labels.length - 1],
    polynomial: `poly(${labels.join(",")})`,
    cyclotomic_exponents: {},
  };
}

function baseResponse(overrides: Partial<GenerateResponse> = {}): GenerateResponse {
  return {
    dice: 2,
    faces: 6,
    cyclotomic_divisors: [2, 3, 6],
    canonical_polynomial: "x + x^2 + x^3 + x^4 + x^5 + x^6",
    factorization: "x Φ_2(x) Φ_3(x) Φ_6(x)",
    candidate_die_count: 5,
    solution_count: 2,
    non_standard_solution_count: 1,
    elapsed_ms: 1.23,
    solutions: [
      { is_standard: false, dice: [die([1, 2, 2, 3, 3, 4]), die([1, 3, 4, 5, 6, 8])] },
      { is_standard: true, dice: [die([1, 2, 3, 4, 5, 6]), die([1, 2, 3, 4, 5, 6])] },
    ],
    ...overrides,
  };
}

function okFetch(body: GenerateResponse) {
  return vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
}

function renderApp() {
  const { container } = render(<App />);
  const form = container.querySelector("form")!;
  return { container, submit: () => fireEvent.submit(form) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("App", () => {
  it("renders the configuration form before any search", () => {
    renderApp();
    expect(screen.getByRole("button", { name: /Generate Sicherman dice/i })).toBeEnabled();
    expect(screen.queryByText(/non-standard solution/i)).not.toBeInTheDocument();
  });

  it("shows a single non-standard solution and hides ordinary dice by default", async () => {
    vi.stubGlobal("fetch", okFetch(baseResponse()));
    const { submit } = renderApp();
    submit();

    expect(await screen.findByText("1 non-standard solution")).toBeInTheDocument();
    expect(screen.getByText(/Search complete · 1.23 ms/)).toBeInTheDocument();
    expect(screen.getByText("Sicherman-equivalent")).toBeInTheDocument();
    expect(screen.queryByText("ordinary")).not.toBeInTheDocument();
  });

  it("pluralizes the non-standard solution count", async () => {
    vi.stubGlobal("fetch", okFetch(baseResponse({ non_standard_solution_count: 2 })));
    const { submit } = renderApp();
    submit();
    expect(await screen.findByText("2 non-standard solutions")).toBeInTheDocument();
  });

  it("includes ordinary dice when the toggle is enabled", async () => {
    vi.stubGlobal("fetch", okFetch(baseResponse()));
    const { submit } = renderApp();
    submit();
    await screen.findByText("1 non-standard solution");

    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByText("ordinary")).toBeInTheDocument();
    expect(screen.getAllByText(/^Solution \d$/)).toHaveLength(2);
  });

  it("shows the empty state when there are no non-standard solutions", async () => {
    const allStandard = baseResponse({
      non_standard_solution_count: 0,
      solutions: [{ is_standard: true, dice: [die([1, 2, 3, 4, 5]), die([1, 2, 3, 4, 5])] }],
    });
    vi.stubGlobal("fetch", okFetch(allStandard));
    const { submit } = renderApp();
    submit();

    expect(await screen.findByText("No strange dice this time.")).toBeInTheDocument();
  });

  it("reveals and hides the math explanation", async () => {
    vi.stubGlobal("fetch", okFetch(baseResponse()));
    const { submit } = renderApp();
    submit();
    await screen.findByText("1 non-standard solution");

    const toggle = screen.getByRole("button", { name: /Why does this work/i });
    fireEvent.click(toggle);
    expect(screen.getByText("x + x^2 + x^3 + x^4 + x^5 + x^6")).toBeInTheDocument();
    expect(screen.getByText("x Φ_2(x) Φ_3(x) Φ_6(x)")).toBeInTheDocument();

    fireEvent.click(toggle);
    await waitFor(() =>
      expect(screen.queryByText("x Φ_2(x) Φ_3(x) Φ_6(x)")).not.toBeInTheDocument(),
    );
  });

  it("surfaces the API error detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: "faces must be between 2 and 20" }),
      }),
    );
    const { submit } = renderApp();
    submit();
    expect(await screen.findByText("faces must be between 2 and 20")).toBeInTheDocument();
  });

  it("falls back to a default message when the error body is unreadable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: () => Promise.reject(new Error("no body")) }),
    );
    const { submit } = renderApp();
    submit();
    expect(
      await screen.findByText("The generator could not complete this request."),
    ).toBeInTheDocument();
  });

  it("reports a thrown Error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const { submit } = renderApp();
    submit();
    expect(await screen.findByText("network down")).toBeInTheDocument();
  });

  it("reports a non-Error rejection as an unexpected error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("just a string"));
    const { submit } = renderApp();
    submit();
    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
  });

  it("disables the button and shows progress while the request is in flight", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));
    const { submit } = renderApp();
    submit();

    const button = screen.getByRole("button", { name: /Factoring polynomials/i });
    expect(button).toBeDisabled();

    resolveFetch({ ok: true, json: () => Promise.resolve(baseResponse()) });
    expect(await screen.findByText("1 non-standard solution")).toBeInTheDocument();
  });

  it("prefixes requests with VITE_API_BASE when configured", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE", "http://api.test");
    const fetchMock = okFetch(baseResponse());
    vi.stubGlobal("fetch", fetchMock);

    const { default: FreshApp } = await import("./App");
    const { container } = render(<FreshApp />);
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/api/generate",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("renders one card per die in a solution", async () => {
    vi.stubGlobal("fetch", okFetch(baseResponse()));
    const { submit } = renderApp();
    submit();
    await screen.findByText("1 non-standard solution");

    const solution = screen.getByText("Solution 1").closest(".solution-card")!;
    expect(within(solution as HTMLElement).getByText("Die 1")).toBeInTheDocument();
    expect(within(solution as HTMLElement).getByText("Die 2")).toBeInTheDocument();
  });
});
