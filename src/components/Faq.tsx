import React, { useState } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { POLICY } from '../lib/policy';
import { FAQS as faqs } from '../lib/faqs';
import { trackFaqOpen } from '../lib/analytics';

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number, question: string) => {
    if (openIndex !== idx) trackFaqOpen(question);
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="scroll-mt-24 py-12 sm:py-16">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-800">
            <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" /> Questions &amp; Answers
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything You Are Wondering
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`overflow-hidden rounded-2xl border-2 transition-colors duration-200 ${
                  isOpen ? 'border-stone-900 bg-white' : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <button
                  onClick={() => toggle(idx, faq.q)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold leading-snug">{faq.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                      isOpen ? 'rotate-180 bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 leading-relaxed text-stone-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Still have questions — routes to the contact page's Netlify form */}
        <div className="mt-10 rounded-2xl bg-stone-900 p-7 text-center text-stone-100">
          <h3 className="text-lg font-bold">Still have a question?</h3>
          <p className="mt-1 text-sm text-stone-400">Our team replies {POLICY.supportReply}.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a
              href="/contact/"
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-amber-500 px-6 py-3 font-bold text-stone-900 transition-colors hover:bg-amber-400"
            >
              Contact us
            </a>
            <a
              href={`mailto:pawgrip@businesslocalrecords.com`}
              className="inline-flex min-h-12 items-center gap-2 rounded-md border border-stone-700 px-6 py-3 font-bold text-stone-200 transition-colors hover:bg-stone-800"
            >
              Email support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
