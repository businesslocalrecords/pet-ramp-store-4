import raw from './product-facts.json';

/** One visible fact from the manufacturer's page. Empty until the desktop pass fills it. */
export interface SpecRow {
  label: string;
  value: string;
}

export interface FactQuestion {
  q: string;
  a: string;
}

/**
 * Product-specific copy for the catalog landing page.
 * Keyed by catalog slug (`dp-53683`, `side-door-pet-steps`).
 * The car-ramp flagship does not read this file.
 */
export interface ProductFacts {
  sourceUrl: string;
  details: string[];
  instructions: string[];
  specs: SpecRow[];
  included: string[];
  questions: FactQuestion[];
}

interface FactsFile {
  products: Record<string, Partial<ProductFacts>>;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function factsFor(slug: string): ProductFacts | null {
  const entry = (raw as FactsFile).products[slug];
  if (!entry) return null;
  return {
    sourceUrl: typeof entry.sourceUrl === 'string' ? entry.sourceUrl : '',
    details: strings(entry.details),
    instructions: strings(entry.instructions),
    specs: Array.isArray(entry.specs)
      ? entry.specs.filter(
          (row): row is SpecRow =>
            !!row && typeof row.label === 'string' && typeof row.value === 'string' && row.label.trim() !== '' && row.value.trim() !== '',
        )
      : [],
    included: strings(entry.included),
    questions: Array.isArray(entry.questions)
      ? entry.questions.filter(
          (row): row is FactQuestion =>
            !!row && typeof row.q === 'string' && typeof row.a === 'string' && row.q.trim() !== '' && row.a.trim() !== '',
        )
      : [],
  };
}
