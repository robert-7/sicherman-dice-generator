import { Sigma } from "lucide-react";
import type { Die } from "../types";

const palette = ["violet", "cyan", "amber", "rose", "emerald", "blue"];

export function DieCard({ die, index }: { die: Die; index: number }) {
  return (
    <article className={`die-card ${palette[index % palette.length]}`}>
      <div className="die-card__topline">
        <span>Die {index + 1}</span>
        <span className="max-chip">max {die.max_label}</span>
      </div>
      <div className="face-grid" aria-label={`Labels for die ${index + 1}`}>
        {die.labels.map((label, faceIndex) => (
          <div className="face" key={`${label}-${faceIndex}`}>
            {label}
          </div>
        ))}
      </div>
      <div className="poly-row">
        <Sigma size={15} />
        <code>{die.polynomial}</code>
      </div>
    </article>
  );
}
