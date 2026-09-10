export type Die = {
  labels: number[];
  max_label: number;
  polynomial: string;
  cyclotomic_exponents: Record<string, number>;
};

export type DiceSolution = {
  dice: Die[];
  is_standard: boolean;
};

export type GenerateResponse = {
  dice: number;
  faces: number;
  cyclotomic_divisors: number[];
  canonical_polynomial: string;
  factorization: string;
  candidate_die_count: number;
  solution_count: number;
  non_standard_solution_count: number;
  elapsed_ms: number;
  solutions: DiceSolution[];
};
