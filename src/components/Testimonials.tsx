import React from 'react';
import { Star, Quote, BadgeCheck, ThumbsUp } from 'lucide-react';
import { GATES } from '../lib/assets';

/**
 * Verified buyer reviews — GATED, data empty by design.
 *
 * Renders nothing until `GATES.testimonials` is enabled, and even then the
 * list below must be filled from a REAL review source (Judge.me, Shopify
 * Product Reviews, or a manual audit of order confirmations). The previous
 * version shipped invented reviews — fake names, dates, "142 found this
 * helpful" counts, a 4.9/2,847 aggregate, "94% would buy again", "12,000+
 * ramps delivered". Publishing invented reviews violates FTC endorsement
 * rules and ad-network policy, so the data is empty and the section shows an
 * explicit empty state until real data is wired in.
 *
 * To enable: replace `reviews` with the fetched data, restore the aggregate
 * header and summary strip from real values, then flip the gate in
 * src/lib/assets.ts and cross the item off LAUNCH_BLOCKERS.md.
 */

interface Review {
  name: string;
  location: string;
  dog: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  helpful: number;
}

/** Empty until a real review source is wired in. Do not hand-fill. */
const reviews: Review[] = [];

const Stars: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`${size} ${i <= rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300 fill-stone-200'}`}
      />
    ))}
  </div>
);

/** Avatar initials in a deterministic gradient tile. */
const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  const palettes = [
    'from-amber-400 to-orange-500',
    'from-stone-600 to-stone-800',
    'from-emerald-400 to-teal-600',
    'from-sky-400 to-indigo-600',
    'from-rose-400 to-pink-600',
    'from-violet-400 to-purple-600',
  ];
  const palette = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <div
      className={`w-11 h-11 rounded-full bg-gradient-to-br ${palette} flex items-center justify-center text-white font-bold text-sm shrink-0`}
    >
      {initials}
    </div>
  );
};

export const Testimonials: React.FC = () => {
  // Gate after the hooks so hook order is stable across renders.
  if (!GATES.testimonials) return null;

  return (
    <section id="reviews" className="py-12 sm:py-16 px-4 sm:px-6 bg-white text-stone-900 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-mist text-pine-deep">
            <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" /> Verified Buyer Reviews
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            What Owners Report
          </h2>
        </div>

        {reviews.length === 0 ? (
          /* Loud empty state — the gate must never ship invented reviews. */
          <div className="rounded-2xl border-2 border-dashed border-stone-300 p-10 text-center">
            <h3 className="font-bold text-stone-900">No review source connected</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600">
              This section is gated on purpose. Connect a real review source in{' '}
              <code className="font-mono text-xs">src/components/Testimonials.tsx</code> (see the
              file header) before enabling <code className="font-mono text-xs">GATES.testimonials</code>{' '}
              in <code className="font-mono text-xs">src/lib/assets.ts</code>.
            </p>
          </div>
        ) : (
          <>
            {/* Review grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col p-6 rounded-3xl bg-stone-50 border border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-300"
                >
                  <Quote className="absolute top-5 right-5 w-8 h-8 text-stone-200" aria-hidden="true" />

                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={review.name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm truncate">{review.name}</span>
                        <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        {review.location} &middot; {review.dog}
                      </p>
                    </div>
                  </div>

                  <Stars rating={review.rating} />

                  <h3 className="mt-3 font-bold text-base leading-snug">{review.title}</h3>
                  <p className="mt-2 text-sm text-stone-600 leading-relaxed flex-1">{review.body}</p>

                  <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                    <span>{review.date}</span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                      {review.helpful} found this helpful
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/*
              Aggregate rating + summary strip (verified-review counts, average
              rating, "would recommend") belong here, rendered ONLY from the
              connected review source's real numbers.
            */}
          </>
        )}
      </div>
    </section>
  );
};
