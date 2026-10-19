import React from 'react';
import { PackageCheck, Truck, Clock, RotateCcw, ShieldCheck, MapPin } from 'lucide-react';
import { POLICY } from '../lib/policy';

interface Step {
  num: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  {
    num: '1',
    title: 'Order in 60 Seconds',
    desc: 'Choose your size, check out securely with Shop Pay, Apple Pay, or card. Every order ships free, insured and fully tracked.',
    icon: PackageCheck,
  },
  {
    num: '2',
    title: `Arrives in ${POLICY.deliveryWindow}`,
    desc: 'Insured express delivery from our domestic warehouse, fully tracked. Free on every order — no minimum.',
    icon: Truck,
  },
  {
    num: '3',
    title: 'Try It Risk-Free',
    desc: `Give your dog up to ${POLICY.returnDays} days to get comfortable. Watch them walk up on their own — most dogs take a few short sessions.`,
    icon: Clock,
  },
  {
    num: '4',
    title: 'Love It or Return It',
    desc: 'Not the right fit? Email us for a prepaid return label and a full refund once the ramp reaches the warehouse. No restocking fee.',
    icon: RotateCcw,
  },
];

/**
 * Shipping & returns section. Every number is sourced from lib/policy.ts —
 * the previous version hardcoded "2–5 days", "30 days" and a 1-year
 * warranty in prose, and promised Canada/UK shipping the store has not
 * set up. Full details live on the /shipping/, /returns/ and /warranty/
 * policy pages.
 */
export const ShippingReturns: React.FC = () => {
  return (
    <section id="shipping" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-pine-deep">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Service promise
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Shipping &amp; Returns, Completely Sorted
        </h2>
        <p className="mt-3 text-stone-600">
          Fast, free, insured &mdash; and a guarantee with zero fine print.
        </p>
      </div>

      {/* Steps grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl border border-stone-200 bg-stone-50 p-7"
          >
            <span className="absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 font-extrabold text-white shadow-sm">
              {step.num}
            </span>
            <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-mist">
              <step.icon className="h-6 w-6 text-pine" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-stone-600">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Detail panels */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-stone-200 p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <MapPin className="h-5 w-5 text-stone-900" aria-hidden="true" />
            <h4 className="font-bold">Where we ship</h4>
          </div>
          <p className="text-sm leading-relaxed text-stone-600">
            All 50 US states via insured express carriers. Shipping somewhere else? Email us
            before ordering and we will tell you what is possible.
          </p>
          <a href="/shipping/" className="mt-3 inline-block text-sm font-bold text-blue-700 underline">
            Full shipping policy
          </a>
        </div>

        <div className="rounded-2xl border-2 border-stone-200 p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <RotateCcw className="h-5 w-5 text-stone-900" aria-hidden="true" />
            <h4 className="font-bold">Return policy</h4>
          </div>
          <p className="text-sm leading-relaxed text-stone-600">
            {POLICY.returnDays} days from delivery, used or unused. Email us and we send a prepaid
            label. Refunds are issued once the warehouse receives the ramp.
          </p>
          <a href="/returns/" className="mt-3 inline-block text-sm font-bold text-blue-700 underline">
            Full returns policy
          </a>
        </div>

        <div className="rounded-2xl border-2 border-stone-200 p-6">
          <div className="mb-3 flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-stone-900" aria-hidden="true" />
            <h4 className="font-bold">{POLICY.warrantyMonths}-month warranty</h4>
          </div>
          <p className="text-sm leading-relaxed text-stone-600">
            Every ramp is covered against manufacturing defects for {POLICY.warrantyMonths} months
            &mdash; frame, surface, and hardware. The {POLICY.returnDays}-day money-back guarantee
            is separate and unconditional.
          </p>
          <a href="/warranty/" className="mt-3 inline-block text-sm font-bold text-blue-700 underline">
            Full warranty terms
          </a>
        </div>
      </div>
    </section>
  );
};
