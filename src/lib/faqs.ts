import { RAMP_SIZES, COMPACT_MAX_HEIGHT_IN } from './offers';
import { POLICY } from './policy';

export interface FaqEntry {
  q: string;
  a: string;
  /** Short answer for the buy box's quick answers; marks the FAQ as featured. */
  short?: string;
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
export const FAQS: FaqEntry[] = [
  {
    q: 'Will my dog actually use it?',
    short: `Many dogs walk it within a few short sessions: lay it flat first, add treats, then raise it. If yours still won't, you get a full refund within ${POLICY.returnDays} days of delivery.`,
    a: 'Many dogs walk up a ramp within a few short sessions, and the design gives them every reason to: a gentle slope, a textured deck that grips nails, and side rails so they cannot slip off the edge. Start slow — let your dog sniff the ramp, place treats along it, and praise each step. Two or three short sessions is typical; some cautious dogs need longer, which is what the trial period is for.',
  },
  {
    q: 'How do I know which size fits my vehicle?',
    short: `Measure from the ground to your cargo floor or seat. Up to about ${COMPACT_MAX_HEIGHT_IN}″, the ${compact.lengthIn}″ Compact gives a comfortable slope. Use the size finder below, or email us a photo of your vehicle.`,
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
    q: 'Will my dog slip on it?',
    short: 'The deck has a grit surface that paws and nails can grip, with raised side rails along its full length. Rubberized feet keep the ramp planted.',
    a: `The walking deck has a grit surface that paws and nails can grip, and raised side rails run its full length. The feet are rubberized; on a smooth garage floor or bumper, add the traction mat — it locks the ramp feet down and stops bumper scuffing.`,
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
    a: `No. Unfold it and set it against your vehicle — it ships with a quick-start fit card for your vehicle height. It folds in half to ${compact.foldedIn}″ (Compact) or ${extended.foldedIn}″ (Extended), and the safety latch holds it closed for storage in your trunk or garage.`,
  },
];

/** The buy box's quick answers — every FAQ that carries a `short` answer. */
export const FEATURED_FAQS = FAQS.filter(
  (f): f is FaqEntry & { short: string } => Boolean(f.short)
);
