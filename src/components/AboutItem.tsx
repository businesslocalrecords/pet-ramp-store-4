import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { RAMP_SIZES } from '../lib/offers';
import { GUARANTEE_LABEL, WARRANTY_PRODUCT_LABEL } from '../lib/policy';

const compact = RAMP_SIZES[0];
const extended = RAMP_SIZES[1];

/**
 * "About This Item" — the retail product-detail pattern (Details /
 * Instructions / Size / FAQ). Every line restates a published spec or policy
 * from offers.ts / policy.ts or an existing FAQ answer; nothing new is claimed
 * (no joint/health wording — see claims.md rule 3).
 *
 * Panels open and close instantly — no height animation.
 */
const DETAILS = [
  `Helps dogs up to ${compact.weightCapacityLb} lb walk into the car instead of being lifted or jumping.`,
  'Paw Grip grit deck that paws and nails can grip, with raised side rails along the full length.',
  `Weighs ${compact.rampWeightLb} lb and folds in half to ${compact.foldedIn}\u2033 with a safety latch, so it stores behind a seat or in the trunk.`,
  `The ${compact.lengthIn}\u2033 Compact suits ${compact.vehicleType.charAt(0).toLowerCase()}${compact.vehicleType.slice(1)}; the size finder checks the slope for your exact height.`,
  `${GUARANTEE_LABEL} and ${WARRANTY_PRODUCT_LABEL}.`,
];

const INSTRUCTIONS = [
  'Unfold the ramp and rest its top edge on your bumper or cargo floor, with the feet on level ground.',
  'Check that it sits steady before your dog steps on.',
  'First time? Lay it flat on the ground, place treats along it and praise each step, then raise it to the car.',
  'To store, fold it in half and close the safety latch.',
];

const SPECS: [string, string][] = [
  ['Length (open)', `${compact.lengthIn}\u2033`],
  ['Length (folded)', `${compact.foldedIn}\u2033`],
  ['Width', `${compact.widthIn}\u2033`],
  ['Deck height', `${compact.deckHeightIn}\u2033`],
  ['Weight capacity', `${compact.weightCapacityLb} lb`],
  ['Ramp weight', `${compact.rampWeightLb} lb`],
];

type PanelId = 'details' | 'instructions' | 'size';

export const AboutItem: React.FC = () => {
  const [open, setOpen] = useState<PanelId | null>('details');
  const toggle = (id: PanelId) => setOpen(open === id ? null : id);

  const header = (id: PanelId, title: string) => (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-expanded={open === id}
      aria-controls={`about-${id}`}
      className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-bold text-stone-900"
    >
      {title}
      {open === id ? (
        <Minus className="h-5 w-5 shrink-0" aria-hidden="true" />
      ) : (
        <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <section id="about-item" className="scroll-mt-24">
      <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">About This Item</h2>

      <div className="mt-3 divide-y divide-stone-200 border-y border-stone-200 [overflow-anchor:none]">
        <div>
          {header('details', 'Details')}
          {open === 'details' && (
            <ul id="about-details" className="list-disc space-y-1.5 pb-5 pl-5 text-[0.9375rem] leading-relaxed text-stone-700">
              {DETAILS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {header('instructions', 'Instructions')}
          {open === 'instructions' && (
            <div id="about-instructions" className="pb-5 text-[0.9375rem] leading-relaxed text-stone-700">
              <ol className="list-decimal space-y-1.5 pl-5">
                {INSTRUCTIONS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-stone-500">
                Ships with a quick-start fit card for your vehicle height.
              </p>
            </div>
          )}
        </div>

        <div>
          {header('size', 'Size')}
          {open === 'size' && (
            <div id="about-size" className="pb-5">
              <dl className="divide-y divide-stone-100 text-[0.9375rem]">
                {SPECS.map(([term, value]) => (
                  <div key={term} className="flex justify-between gap-4 py-2">
                    <dt className="text-stone-500">{term}</dt>
                    <dd className="font-bold text-stone-900">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-stone-500">
                {compact.name} {compact.lengthIn}&Prime; shown. The {extended.name}{' '}
                ({extended.lengthIn}&Prime;, {extended.weightCapacityLb} lb rated) is coming soon.{' '}
                <a href="#size-guide" className="font-medium text-blue-700 underline">
                  Find your size
                </a>
              </p>
            </div>
          )}
        </div>

        <a
          href="#faq"
          className="flex min-h-14 items-center justify-between gap-4 py-4 font-bold text-stone-900"
        >
          FAQ
          <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
};
