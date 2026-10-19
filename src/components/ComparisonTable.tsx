import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, Check } from 'lucide-react';
import { RAMP_SIZES, slopeDeg, COMPACT_MAX_HEIGHT_IN } from '../lib/offers';

type Cell = true | false | 'partial' | 'na';

interface Row {
  feature: string;
  /** [Compact, Extended, Lifting, Jumping] */
  cells: Cell[];
}

const COMPACT_SLOPE_24 = Math.round(slopeDeg(24, RAMP_SIZES[0].lengthIn));

/**
 * Honest comparison.
 *
 * Replaces the old "PawGrip Pro vs. Cheap Knockoffs" table, which asserted
 * unverifiable claims about competitors' products. This version compares the
 * two published sizes of THIS ramp against the two real alternatives
 * (lifting, letting the dog jump), states a limitation for each column, and
 * ends with a buyer's checklist that would help you evaluate ANY ramp.
 */
const rows: Row[] = [
  {
    feature: `Gentle walking slope (about ${COMPACT_SLOPE_24}° at a 24″ height)`,
    cells: [true, true, 'na', false],
  },
  {
    feature: 'Reaches taller vehicles (over 30″ cargo height)',
    cells: ['partial', true, 'partial', 'partial'],
  },
  {
    feature: 'Published rating of 250 lb',
    cells: [false, true, 'partial', false],
  },
  {
    feature: 'No strain on your back',
    cells: [true, true, false, true],
  },
  {
    feature: 'Side rails so a nervous dog cannot slip off',
    cells: [true, true, 'na', 'na'],
  },
  {
    feature: 'Folds flat for storage',
    cells: [true, true, 'na', 'na'],
  },
];

/** The limitation row — every column admits its downside. */
const LIMITATIONS: string[] = [
  `Slope steepens above about ${COMPACT_MAX_HEIGHT_IN}″ cargo height`,
  'Longer and heavier to carry and store',
  'Strains your back; risky for a big or senior dog',
  'Repeated joint load — the reason owners shop for a ramp',
];

const COLUMNS = ['Compact', 'Extended', 'Lifting', 'Letting them jump'];

/** What to look for in ANY ramp, ours or a competitor's. */
const CHECKLIST = [
  'Ramp length against your vehicle height — a longer ramp means a gentler slope (the size finder above computes it)',
  'A published weight rating comfortably above your dog',
  'A textured, high-traction walking surface that grips nails',
  'Side rails so a nervous dog cannot slip off the edge',
  'Non-slip feet that grip wet pavement and smooth garage floors',
  'A folded length that actually fits where you plan to store it',
];

const CellIcon: React.FC<{ value: Cell }> = ({ value }) => {
  if (value === true) {
    return <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" aria-label="Yes" />;
  }
  if (value === 'partial') {
    return <MinusCircle className="mx-auto h-6 w-6 text-amber-500" aria-label="Depends" />;
  }
  if (value === 'na') {
    return <span className="text-sm font-medium text-stone-300" aria-label="Not applicable">&mdash;</span>;
  }
  return <XCircle className="mx-auto h-6 w-6 text-red-500" aria-label="No" />;
};

export const ComparisonTable: React.FC = () => {
  return (
    <section id="compare" className="scroll-mt-24 py-12 sm:py-16">
      <header className="mb-7">
        <span className="inline-flex items-center rounded-full bg-mist px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-pine">
          Head to head
        </span>
        <h2 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
          Ramp vs. lifting vs. letting them jump
        </h2>
        <p className="mt-2 max-w-xl text-stone-600">
          An honest look at the options — including what each one costs you.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-gray-900/5">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-900/5">
              <th scope="col" className="px-3 py-3 text-xs font-semibold text-stone-500">
                Option
              </th>
              {COLUMNS.map((col, idx) => (
                <th key={col} scope="col" className="px-2 py-3 text-center">
                  <span
                    className={`block text-xs font-bold ${idx < 2 ? 'text-pine' : 'text-stone-700'}`}
                  >
                    {col}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-900/5 last:border-0 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
                }`}
              >
                <th scope="row" className="px-3 py-2.5 text-[13px] font-medium text-stone-800">
                  {row.feature}
                </th>
                {row.cells.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-2 py-2.5 ${cIdx < 2 ? 'bg-mist/40 ring-1 ring-inset ring-pine/20' : ''}`}
                  >
                    <CellIcon value={cell} />
                  </td>
                ))}
              </tr>
            ))}

            {/* Limitation row */}
            <tr className="border-t-2 border-line bg-mist/70">
              <th scope="row" className="px-3 py-3 align-top text-[13px] font-bold text-stone-900">
                Honest limitation
              </th>
              {LIMITATIONS.map((text, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-2 py-3 align-top text-[11px] leading-relaxed text-stone-600 ${
                    cIdx < 2 ? 'bg-mist/40 ring-1 ring-inset ring-pine/20' : ''
                  }`}
                >
                  {text}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Yes
        </span>
        <span className="flex items-center gap-1.5">
          <MinusCircle className="h-4 w-4 text-amber-500" /> Depends
        </span>
        <span className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-red-500" /> No
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-stone-300">&mdash;</span> Not applicable
        </span>
      </div>

      {/* Buyer's checklist — works for any ramp */}
      <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <h3 className="text-lg font-bold text-stone-900">What to look for in any ramp</h3>
        <p className="mt-1 text-sm text-stone-600">
          Ours or anyone else&rsquo;s &mdash; these are the specs that decide whether a ramp
          actually works for your dog and your vehicle.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-stone-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
