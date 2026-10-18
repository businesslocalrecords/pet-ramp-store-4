import React from 'react';
import { PawPrint, Mail, Phone, MapPin, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { BUSINESS, BUSINESS_IS_INCOMPLETE, REQUIRE_BUSINESS_INFO } from '../lib/assets';
import { POLICY } from '../lib/policy';

const CURRENT_YEAR = new Date().getFullYear();

const linkGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Shop ramps', href: '/dog-ramps' },
      { label: 'Foldable car ramp', href: '/products/foldable-dog-car-ramp' },
      { label: 'Size finder', href: '/products/foldable-dog-car-ramp#size-guide' },
      { label: 'FAQ', href: '/products/foldable-dog-car-ramp#faq' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Shipping policy', href: '/shipping/' },
      { label: 'Returns policy', href: '/returns/' },
      { label: 'Warranty', href: '/warranty/' },
      { label: 'Contact us', href: '/contact/' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about/' },
      { label: 'How to choose a dog car ramp', href: '/guide/how-to-choose-a-dog-car-ramp/' },
      { label: 'Privacy policy', href: '/privacy/' },
      { label: 'Terms of service', href: '/terms/' },
    ],
  },
];

/**
 * Site footer.
 *
 * Business identity lives in src/lib/assets.ts (single source, shared with
 * the Footer's launch guard). V3 removed two fabricated claims that used to
 * live here: "Join 12,000+ owners" (an invented customer count) and the
 * "Lifetime hardware warranty" (the real warranty is POLICY.warrantyMonths).
 *
 * The dead social-icon row was removed until real profiles exist.
 */
export const Footer: React.FC = () => {
  // Launch guard: when the owner opts in via VITE_REQUIRE_BUSINESS_INFO, a
  // missing business identity is a hard failure rather than a silent one.
  // (vite.config.ts already failed the build in that state; this catches a
  // runtime deploy of stale env values.)
  if (REQUIRE_BUSINESS_INFO && BUSINESS_IS_INCOMPLETE) {
    throw new Error(
      'VITE_REQUIRE_BUSINESS_INFO is set but BUSINESS in src/lib/assets.ts still contains placeholders. ' +
        'Fill in the real address and phone, or unset the flag.'
    );
  }

  return (
    <footer className="bg-stone-950 text-stone-400">
      {/* Dev warning while business details are placeholders */}
      {BUSINESS_IS_INCOMPLETE && (
        <div className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2.5 text-center text-[11px] font-medium text-amber-300">
          Developer notice: business address and phone are still placeholders.
          Replace the <code className="font-mono">BUSINESS</code> object in{' '}
          <code className="font-mono">src/lib/assets.ts</code> before running Google Ads / PMax.
        </div>
      )}

      {/* Final CTA */}
      <div className="border-b border-stone-800">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            The walk in. Not the hoist.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-400">
            {POLICY.returnDays} days to try it in your own car, free insured shipping, and a full refund if the dog will not take it.
          </p>
          <a
            href="/products/foldable-dog-car-ramp"
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#F37021] px-9 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-[#D95E1A]"
          >
            Shop the car ramp
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Brand + verified business identity */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
                <PawPrint className="h-6 w-6 text-stone-900" aria-hidden="true" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                {BUSINESS.legalName}
              </span>
            </div>

            {/* Physical address — required for Merchant Center trust */}
            <address className="space-y-1.5 text-sm not-italic">
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <span>
                  {BUSINESS.addressLine1}
                  {BUSINESS.addressLine2 && (
                    <>
                      <br />
                      {BUSINESS.addressLine2}
                    </>
                  )}
                  <br />
                  {BUSINESS.city}, {BUSINESS.state} {BUSINESS.postalCode}
                  <br />
                  {BUSINESS.country}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <a href={`mailto:${BUSINESS.email}`} className="hover:text-amber-400">
                  {BUSINESS.email}
                </a>
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <a href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, '')}`} className="hover:text-amber-400">
                  {BUSINESS.phone}
                </a>
              </span>
            </address>

            <div className="mt-6 flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-amber-500" aria-hidden="true" /> Free insured shipping
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-amber-500" aria-hidden="true" /> {POLICY.returnDays}-day
                returns
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-500" aria-hidden="true" /> {POLICY.warrantyMonths}
                -month warranty
              </span>
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-bold text-white">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm transition-colors hover:text-amber-400">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs sm:flex-row sm:px-6">
          <p>
            &copy; {CURRENT_YEAR} {BUSINESS.legalName}. All rights reserved.
          </p>
          <p className="text-stone-500">
            {BUSINESS.city && !BUSINESS.city.startsWith('REPLACE_')
              ? `Ships from ${BUSINESS.city}, ${BUSINESS.state}`
              : 'Ships from a US fulfillment center'}
          </p>
        </div>
      </div>
    </footer>
  );
};
