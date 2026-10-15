import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FEATURED_FAQS } from '../lib/faqs';
import { trackFaqOpen } from '../lib/analytics';

/**
 * Quick answers — a small card directly under the checkout box. Shows the
 * FAQs flagged with a `short` answer in lib/faqs.ts, so the wording has one
 * source.
 *
 * Opens and closes instantly, with no height animation: this sits in the
 * sticky buy column, where an animating height makes the column re-pin every
 * frame and visibly jitter. One answer is open at a time; state lives only
 * in React (no <details>, whose native toggle fights a controlled `open`).
 */
export const QuickAnswers: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number, question: string) => {
    if (openIndex !== idx) trackFaqOpen(question);
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="divide-y divide-gray-200 rounded-md border border-gray-300 bg-white px-5 [overflow-anchor:none]">
      {FEATURED_FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `quick-answer-${idx}`;
        return (
          <div key={faq.q}>
            <button
              type="button"
              onClick={() => toggle(idx, faq.q)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left text-[0.8125rem] font-bold text-gray-900"
            >
              {faq.q}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <p id={panelId} className="pb-3 text-[0.8125rem] leading-relaxed text-gray-600">
                {faq.short}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
