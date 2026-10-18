import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS } from '../lib/assets';
import { slopeDeg, RAMP_SIZES } from '../lib/offers';
import {
  FREE_SHIPPING_LABEL,
  GUARANTEE_LABEL,
  POLICY,
  WARRANTY_PRODUCT_LABEL,
} from '../lib/policy';

const prose = 'mx-auto max-w-3xl px-4 py-12 text-[#444] sm:px-6 [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:text-[#14202B] [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#14202B] [&_a]:font-semibold [&_a]:text-[#0F6E62] [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1';

export const AboutPage: React.FC = () => (
  <main className={prose}>
    <h1>About Paw-Grip</h1>
    <p className="text-sm text-[#5C6B73]">Last updated: October 2026</p>
    <p>
      Paw-Grip is a shop for dog ramps and stairs: into the car, onto the bed, and up to the back seat.
      The foldable car ramp is the product we size in detail. The rest of the catalog is here so you can match the ramp to the job.
    </p>
    <h2>Why this exists</h2>
    <p>
      Every day, owners of big and aging dogs make the same trade: lift 70 lb into the trunk, or watch the dog jump.
      A ramp should be long enough for the vehicle, rated for the dog it is sold to, and plain about what it is.
    </p>
    <h2>How we work</h2>
    <ul>
      <li>
        <strong>Published specifications.</strong> The car ramp lists its real length, folded size, and weight rating.
        The size finder uses those numbers.
      </li>
      <li>
        <strong>Ratings, not reviews.</strong> Product cards show a star rating and a count. We do not publish review quotes.
      </li>
      <li>
        <strong>A trial, not a trap.</strong> {GUARANTEE_LABEL}, a prepaid return label, and a {WARRANTY_PRODUCT_LABEL}.
      </li>
    </ul>
    <p>
      <Link to="/contact">Talk to us</Link>. We reply {POLICY.supportReply}.
    </p>
  </main>
);

export const ShippingPage: React.FC = () => (
  <main className={prose}>
    <h1>Shipping Policy</h1>
    <p className="text-sm text-[#5C6B73]">Last updated: October 2026</p>
    <p>Every Paw-Grip order ships free and insured. The same numbers are on the product pages.</p>
    <h2>Where we ship</h2>
    <p>
      We ship to all 50 US states. Shipping outside the US? Email{' '}
      <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> before ordering.
    </p>
    <h2>Shipping method</h2>
    <p>{FREE_SHIPPING_LABEL}. You get a tracking link by email when the order leaves the warehouse.</p>
    <h2>Delivery time and cost</h2>
    <p>
      Insured shipping on every order is free. The delivery window we quote is {POLICY.deliveryWindow} across the continental US.
      That window is a carrier estimate. Severe weather can extend it.
    </p>
    <h2>Lost or damaged in transit</h2>
    <p>
      Every shipment is insured. If a ramp arrives damaged, or tracking says delivered and nothing turns up, email us with the order number.
    </p>
  </main>
);

export const ReturnsPage: React.FC = () => (
  <main className={prose}>
    <h1>Returns and refunds</h1>
    <p className="text-sm text-[#5C6B73]">Last updated: October 2026</p>
    <p>
      Try the ramp with your dog, in your car, for {POLICY.returnDays} days. If it does not work out, we take it back — used or unused — and refund you in full.
    </p>
    <h2>The short version</h2>
    <ol>
      <li>
        Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> within {POLICY.returnDays} days of delivery with your order number.
      </li>
      <li>We send a prepaid return label. Return shipping is on us.</li>
      <li>Pack the ramp and hand it to the carrier.</li>
      <li>Once the warehouse receives it, the refund goes back to the original payment method.</li>
    </ol>
    <p>No restocking fee.</p>
    <h2>Wrong size?</h2>
    <p>
      If the size is not right, tell us before you ship it back. The <Link to="/guide/how-to-choose-a-dog-car-ramp">size guide</Link> and the size finder exist so this does not happen.
    </p>
    <h2>Damaged or faulty</h2>
    <p>
      A manufacturing defect is covered by the <Link to="/warranty">{WARRANTY_PRODUCT_LABEL}</Link>, separate from the {GUARANTEE_LABEL}.
    </p>
  </main>
);

export const WarrantyPage: React.FC = () => (
  <main className={prose}>
    <h1>Hardware warranty</h1>
    <p className="text-sm text-[#5C6B73]">Last updated: October 2026</p>
    <p>
      Every Paw-Grip ramp is covered against manufacturing defects for {POLICY.warrantyMonths} months from delivery — the frame, the walking surface, and the hardware. This sits on top of the <Link to="/returns">{GUARANTEE_LABEL}</Link>.
    </p>
    <h2>What is covered</h2>
    <ul>
      <li>Frame: cracks, bends, or joint failures under the published weight rating.</li>
      <li>Surface: tread separation from the deck.</li>
      <li>Hardware: latches, hinges, and feet failing in normal use.</li>
    </ul>
    <h2>What is not covered</h2>
    <ul>
      <li>Normal wear — scuffs, faded tread, cosmetic marks.</li>
      <li>Damage from misuse: towing, overloading past the published rating, or modification.</li>
      <li>Chewing or scratching by a pet.</li>
    </ul>
    <h2>How to make a claim</h2>
    <p>
      Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your order number and a photo of the fault. We reply {POLICY.supportReply}.
    </p>
  </main>
);

export const PrivacyPage: React.FC = () => (
  <main className={prose}>
    <h1>Privacy Policy</h1>
    <p className="text-sm text-[#5C6B73]">Last updated: October 2026</p>
    <p>This policy explains what Paw-Grip collects when you use this website, and what we do with it.</p>
    <h2>What we collect</h2>
    <ul>
      <li>
        <strong>What you send us.</strong> The contact form and the founding-tester form send the details you type, so we can reply.
      </li>
      <li>
        <strong>Orders.</strong> Checkout runs on Shopify. Payment details are entered there and never reach our servers.
      </li>
      <li>
        <strong>Basic site data.</strong> Hosting and analytics providers may process IP address, browser type, and pages viewed.
      </li>
    </ul>
    <h2>Analytics and advertising cookies</h2>
    <p>
      When configured, this site loads Google Analytics 4, the Google Ads tag, and/or the Meta Pixel to measure ad performance. When those IDs are not set, those cookies are not loaded.
    </p>
    <h2>What we never do</h2>
    <p>We do not sell your personal data. We do not rent it.</p>
    <h2>Your choices</h2>
    <p>
      Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> to ask what we hold, to correct it, or to delete it. We reply {POLICY.supportReply}.
    </p>
  </main>
);

export const TermsPage: React.FC = () => (
  <main className={prose}>
    <h1>Terms of Service</h1>
    <p className="text-sm text-[#5C6B73]">Last updated: October 2026</p>
    <p>These terms govern your use of pawgrip.app and any order you place with Paw-Grip. By ordering, you accept them.</p>
    <h2>Orders and pricing</h2>
    <p>
      All prices are in US dollars. Where a price is shown crossed out, it is a price this store has charged for that item. The price charged is the one at checkout, plus tax Shopify calculates.
    </p>
    <h2>Returns and warranty</h2>
    <p>
      Returns follow the <Link to="/returns">returns policy</Link>: {POLICY.returnDays} days from delivery, used or unused, prepaid label, full refund. Hardware is covered for {POLICY.warrantyMonths} months under the <Link to="/warranty">warranty</Link>.
    </p>
    <h2>Acceptable use</h2>
    <p>Use the site lawfully and do not attempt to disrupt it.</p>
    <h2>Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, Paw-Grip&apos;s liability for a claim from an order is limited to the amount you paid for that order.
    </p>
    <h2>Governing law</h2>
    <p>These terms are governed by the laws of the United States and the state in which the business is registered.</p>
  </main>
);

export const ContactPage: React.FC = () => {
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
      window.dataLayer?.push({ event: 'lead_submit' });
      setSent(true);
    } catch {
      form.submit();
    }
  }

  return (
    <main className={prose}>
      <h1>Contact us</h1>
      <p>A real person replies {POLICY.supportReply}.</p>
      <p>Not sure which size fits? Send a photo of the vehicle with your message and we will size it before you order.</p>
      {sent ? (
        <p className="mt-6 rounded-2xl bg-[#F3F6F7] p-4 font-semibold text-[#14202B]">Message received. We will reply {POLICY.supportReply}.</p>
      ) : (
        <form name="contact" method="POST" action="https://formspree.io/f/mljgpwkd" onSubmit={onSubmit} className="mt-6 space-y-4">
          <input type="hidden" name="form-name" value="contact" />
          <p className="absolute -left-[9999px]">
            <label>Leave this field empty <input type="text" name="bot-field" /></label>
          </p>
          <Field id="name" label="Your name" type="text" autoComplete="name" />
          <Field id="email" label="Email address" type="email" autoComplete="email" />
          <label className="block text-sm font-bold text-[#14202B]" htmlFor="message">Message</label>
          <textarea id="message" name="message" required className="mt-1 w-full rounded-xl border border-[#E4EAEB] p-3" rows={5} />
          <button type="submit" className="inline-flex h-12 items-center rounded-full bg-[#F37021] px-6 font-bold text-white">
            Send
          </button>
        </form>
      )}
    </main>
  );
};

const Field: React.FC<{ id: string; label: string; type: string; autoComplete: string; name?: string }> = ({
  id,
  label,
  type,
  autoComplete,
  name,
}) => (
  <label className="block text-sm font-bold text-[#14202B]" htmlFor={id}>
    {label}
    <input id={id} name={name ?? id} type={type} required autoComplete={autoComplete} className="mt-1 w-full rounded-xl border border-[#E4EAEB] p-3 font-normal" />
  </label>
);

const HEIGHTS = [20, 24, 28, 30, 32, 36];

export const GuidePage: React.FC = () => {
  const [sent, setSent] = useState(false);
  const compact = RAMP_SIZES[0];
  const extended = RAMP_SIZES[1];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
      window.dataLayer?.push({ event: 'tester_apply' });
      setSent(true);
    } catch {
      form.submit();
    }
  }

  return (
    <main className={prose}>
      <p className="text-sm font-bold uppercase tracking-wide text-[#0F6E62]">Buyer&apos;s guide</p>
      <h1>How to choose a dog car ramp</h1>
      <p>Measure first. A ramp that is too short for the vehicle becomes a wall the dog will not walk.</p>
      <h2>1. Measure the vehicle</h2>
      <p>
        Measure from the ground to the surface the dog steps onto — the bumper edge or the cargo floor. Low sedans are often around 20–24″, most SUVs 26–30″, lifted trucks 32–42″.
      </p>
      <h2>2. Match the length to that height</h2>
      <p>
        The ramp is the long side of the slope, so the angle is arcsine(height ÷ length). Longer ramp, gentler slope. The table is the same math as the size finder.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#E4EAEB]">
              <th className="py-2">Cargo height</th>
              <th className="py-2">Compact ({compact.lengthIn}″)</th>
              <th className="py-2">Extended ({extended.lengthIn}″)</th>
            </tr>
          </thead>
          <tbody>
            {HEIGHTS.map((height) => (
              <tr key={height} className="border-b border-[#E4EAEB]">
                <td className="py-2">{height}″</td>
                <td className="py-2 tabular-nums">{slopeDeg(height, compact.lengthIn).toFixed(1)}°</td>
                <td className="py-2 tabular-nums">{slopeDeg(height, extended.lengthIn).toFixed(1)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Past about 30″ of cargo height, the Compact starts to feel steep. That is when the Extended earns the extra length.</p>
      <h2>3. Check the weight rating</h2>
      <p>
        Ours: {compact.weightCapacityLb} lb for the Compact, {extended.weightCapacityLb} lb for the Extended. A rating with no number is a red flag.
      </p>
      <h2>4. Look at the deck and the rails</h2>
      <p>Dogs refuse slick decks. Look for a grit surface that grips nails, and side rails so a nervous dog does not step off the edge.</p>
      <h2>5. Check the feet</h2>
      <p>Rubber feet at both ends, and a mat if the floor is smooth. Bare plastic feet walk away from the bumper.</p>
      <h2>6. Check storage</h2>
      <p>
        The Compact folds to {compact.foldedIn}″. The Extended folds to {extended.foldedIn}″. If it will not fit where you plan to keep it, it will live in the garage unused.
      </p>
      <p>
        The <Link to={{ pathname: '/products/foldable-dog-car-ramp', hash: 'size-guide' }}>size finder</Link> applies this to your height.
      </p>
      <h2>Founding-tester program</h2>
      <p>We are building the next version of this ramp with a small group of owners. No spam, and you can leave whenever you like.</p>
      {sent ? (
        <p className="mt-4 rounded-2xl bg-[#F3F6F7] p-4 font-semibold text-[#14202B]">Application received. We reply {POLICY.supportReply}.</p>
      ) : (
        <form name="founding-tester" method="POST" action="https://formspree.io/f/mrpeyavj" onSubmit={onSubmit} className="mt-4 space-y-4">
          <input type="hidden" name="form-name" value="founding-tester" />
          <Field id="ft-name" name="name" label="Your name" type="text" autoComplete="name" />
          <Field id="ft-email" name="email" label="Email address" type="email" autoComplete="email" />
          <label className="block text-sm font-bold text-[#14202B]" htmlFor="ft-vehicle">
            Vehicle
            <input id="ft-vehicle" name="vehicle" required className="mt-1 w-full rounded-xl border border-[#E4EAEB] p-3 font-normal" placeholder="e.g. 2021 Subaru Outback" />
          </label>
          <label className="block text-sm font-bold text-[#14202B]" htmlFor="ft-dog">
            Your dog
            <select id="ft-dog" name="dog" className="mt-1 w-full rounded-xl border border-[#E4EAEB] p-3 font-normal">
              <option>Senior dog</option>
              <option>Large dog (60 lb+)</option>
              <option>Dog with joint issues</option>
              <option>Two dogs</option>
              <option>Prefer not to say</option>
            </select>
          </label>
          <button type="submit" className="inline-flex h-12 items-center rounded-full bg-[#F37021] px-6 font-bold text-white">
            Apply to the program
          </button>
        </form>
      )}
    </main>
  );
};
