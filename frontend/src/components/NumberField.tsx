import { Minus, Plus } from "lucide-react";

export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  hint: string;
}) {
  const update = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  return (
    <label className="number-field">
      <span className="number-field__label">{label}</span>
      <span className="stepper">
        <button
          type="button"
          onClick={() => update(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus size={17} />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => update(Number(event.target.value) || min)}
        />
        <button
          type="button"
          onClick={() => update(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus size={17} />
        </button>
      </span>
      <small>{hint}</small>
    </label>
  );
}
