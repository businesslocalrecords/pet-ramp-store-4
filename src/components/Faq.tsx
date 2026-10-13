import React, { useState } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { RAMP_SIZES, COMPACT_MAX_HEIGHT_IN } from '../lib/offers';
import { POLICY } from '../lib/policy';
import { trackFaqOpen } from '../lib/analytics';

interface Faq {
  q: string;
  a: string;
}

const compact = RAMP_SIZES[0];
const extended = RAMP_SIZES[1];

/**
 * FAQ answers are written from the store's published specifications and
 * policy values only. The old answers contained invented statistics ("94% of
 * customers…", "static-tested beyond 500 lbs") and implied veterinary
 * endorsement. Where a question is genuinely a veterinary question, the
 * answer says so instead of answering it.
 */
const faqs: Faq[] = [
  {
    q: 'Will my dog actually use it?',
    a: 'Many dogs walk up a ramp within a few short sessions, and the design gives them every reason to: a gentle slope, a textured deck that grips nails, and side rails so they cannot slip off the edge. Start slow — let your dog sniff the ramp, place treats along it, and praise each step. Two or three short sessions is typical; some cautious dogs need longer, which is what the trial period is for.',
  },
  {
    q: 'How do I know which size fits my vehicle?',
    a: `Use the size finder above: measure from the ground to your bumper or cargo floor and it computes the slope for each size. As a rule of thumb, up to about ${COMPACT_MAX_HEIGHT_IN}″ the Compact (${compact.lengthIn}″) is the right call; above that — or for lifted trucks — the Extended (${extended.lengthIn}″) keeps the slope gentler. Still unsure? Send us a photo of your vehicle and we will size it for you.`,
  },
  {
    q: 'Is the ramp suitable for senior dogs?',
    a: 'A ramp replaces a jump with a walk, which is why owners of senior and large dogs ask for one. Whether a ramp is right for your dog’s specific condition is a question for your veterinarian — we make no medical claims about the product.',
  },
  {
    q: 'How much weight can it hold?',
    a: `The published rating is ${compact.weightCapacityLb} lb for the Compact and ${extended.weightCapacityLb} lb for the Extended. Choose the size whose rating sits comfortably above your dog’s weight.`,
  },
  {
    q: 'Will it slip on wet pavement or in my garage?',
    a: `The feet are rubberized for grip and the walking surface is textured. On a smooth garage floor or bumper, add the traction mat — it locks the ramp feet down and stops bumper scuffing.`,
  },
  {
    q: 'How does the money-back guarantee work?',
    a: `If your dog does not take to it, the size is wrong, or you simply change your mind, email us within ${POLICY.returnDays} days of delivery and we will send a prepaid return label. You get a full refund — no restocking fee.`,
  },
  {
    q: 'How fast is shipping, and where do you ship?',
    a: `We ship to the continental United States. Every order ships free, insured and fully tracked, with delivery in ${POLICY.deliveryWindow}. You will receive a tracking link by email as soon as your order leaves.`,
  },
  {
    q: 'Can it be used for trucks with a lift kit?',
    a: `That is what the Extended (${extended.lengthIn}″) is built for — it reaches the cargo height of most lifted trucks. For very tall setups, contact us first and we will tell you honestly whether a ramp can reach your height.`,
  },
  {
    q: 'Is assembly required?',
    a: `The ramp telescopes open and folds flat, and ships with a quick-start fit card for your vehicle height. It folds to ${compact.foldedIn}″ (Compact) or ${extended.foldedIn}″ (Extended) for storage in your trunk or garage.`,
  },
];

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
