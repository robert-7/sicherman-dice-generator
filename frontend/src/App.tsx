import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Atom,
  CheckCircle2,
  ChevronDown,
  Dices,
  ExternalLink,
  FlaskConical,
  GitBranch,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { DieCard } from "./components/DieCard";
import { NumberField } from "./components/NumberField";
import type { GenerateResponse } from "./types";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export default function App() {
  const [dice, setDice] = useState(2);
  const [faces, setFaces] = useState(6);
  const [includeStandard, setIncludeStandard] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMath, setShowMath] = useState(false);

  const visibleSolutions = useMemo(() => {
    if (!result) return [];
    return includeStandard ? result.solutions : result.solutions.filter((solution) => !solution.is_standard);
  }, [result, includeStandard]);

  async function generate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dice, faces }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail ?? "The generator could not complete this request.");
      }
      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <div className="orb orb--one" />
      <div className="orb orb--two" />

      <nav className="nav">
        <a className="brand" href="#top" aria-label="Sicherman Lab home">
          <span className="brand-mark"><Dices size={21} /></span>
          <span>Sicherman <b>Lab</b></span>
        </a>
        <a className="github-link" href="https://github.com/robert-7/sicherman-dice-generator" target="_blank" rel="noreferrer">
          <GitBranch size={17} /> GitHub <ExternalLink size={13} />
        </a>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow"><Sparkles size={15} /> same probabilities, wonderfully strange labels</div>
        <h1>Roll ordinary odds with <span>extraordinary dice.</span></h1>
        <p>
          Generate every positive-integer relabeling of equally-sided dice that preserves the exact sum distribution of the ordinary set.
        </p>
      </section>

      <section className="generator-grid">
        <form className="control-card" onSubmit={generate}>
          <div className="section-heading">
            <div><FlaskConical size={20} /><span>Configure the experiment</span></div>
            <span className="badge">exact search</span>
          </div>

          <div className="fields">
            <NumberField label="Number of dice" value={dice} min={1} max={4} onChange={setDice} hint="1–4 dice" />
            <NumberField label="Faces per die" value={faces} min={2} max={20} onChange={setFaces} hint="2–20 faces" />
          </div>

          <button className="generate-button" type="submit" disabled={loading}>
            {loading ? <LoaderCircle className="spinner" size={20} /> : <Atom size={20} />}
            {loading ? "Factoring polynomials…" : "Generate Sicherman dice"}
          </button>
          <p className="microcopy">Solutions are unique up to reordering the dice and faces.</p>
        </form>

        <aside className="classic-card">
          <div className="classic-icon">⚄</div>
          <div>
            <span className="kicker">The classic pair</span>
            <h2>D6 Sicherman dice</h2>
            <p><b>1, 2, 2, 3, 3, 4</b></p>
            <p><b>1, 3, 4, 5, 6, 8</b></p>
          </div>
          <div className="same-odds"><CheckCircle2 size={17} /> Same 36 sum outcomes</div>
        </aside>
      </section>

      {error && <div className="error-banner">{error}</div>}

      {result && (
        <section className="results">
          <div className="results-header">
            <div>
              <span className="kicker">Search complete · {result.elapsed_ms} ms</span>
              <h2>{result.non_standard_solution_count === 1 ? "1 non-standard solution" : `${result.non_standard_solution_count} non-standard solutions`}</h2>
              <p>
                {result.candidate_die_count} legal die polynomials were tested for {result.dice}D{result.faces}.
              </p>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={includeStandard} onChange={(e) => setIncludeStandard(e.target.checked)} />
              <span /> Include ordinary dice
            </label>
          </div>

          {visibleSolutions.length === 0 ? (
            <div className="empty-state">
              <div>🎲</div>
              <h3>No strange dice this time.</h3>
              <p>The ordinary D{result.faces} set is the only positive-label solution for {result.dice} dice.</p>
            </div>
          ) : (
            <div className="solution-list">
              {visibleSolutions.map((solution, solutionIndex) => (
                <article className="solution-card" key={solutionIndex}>
                  <div className="solution-title">
                    <span>Solution {solutionIndex + 1}</span>
                    {solution.is_standard ? <span className="standard-pill">ordinary</span> : <span className="weird-pill">Sicherman-equivalent</span>}
                  </div>
                  <div className="dice-grid">
                    {solution.dice.map((die, dieIndex) => <DieCard key={dieIndex} die={die} index={dieIndex} />)}
                  </div>
                </article>
              ))}
            </div>
          )}

          <button className="math-toggle" type="button" onClick={() => setShowMath((value) => !value)}>
            <span><Atom size={18} /> Why does this work?</span>
            <ChevronDown size={18} className={showMath ? "rotated" : ""} />
          </button>
          {showMath && (
            <div className="math-panel">
              <p>Encode a D{result.faces} as the generating polynomial</p>
              <code>{result.canonical_polynomial}</code>
              <p>and factor it over the integers as</p>
              <code>{result.factorization}</code>
              <p>
                For {result.dice} dice, every factor appears {result.dice} times. The generator redistributes those irreducible factors among the dice, then keeps only products with non-negative integer coefficients, exactly {result.faces} total faces, and no zero-valued face. Matching the product means matching every coefficient of the sum-distribution generating function.
              </p>
            </div>
          )}
        </section>
      )}

      <footer>
        <span>Built from generating functions, cyclotomic polynomials, and a little mathematical mischief.</span>
        <span>Exact search: 4 dice · 20 faces</span>
      </footer>
    </main>
  );
}
