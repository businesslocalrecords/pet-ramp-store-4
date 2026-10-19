import React from 'react';
import { Loader2, Lock } from 'lucide-react';
import { formatMoney } from '../lib/offers';

interface FlatBuyButtonProps {
  price: number;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}

/**
 * Flat, high-contrast action button in the big-box retail register.
 *
 * Deliberately NOT the neuromorphic 3D button from prototype 1: no hard
 * bottom shadow, no translate-on-press, no transform animations. The Chewy
 * action-orange (#F37021) carries the visual weight instead, so the button
 * reads as an institutional control rather than a game element.
 */
export const FlatBuyButton: React.FC<FlatBuyButtonProps> = ({
  price,
  loading = false,
  disabled = false,
  onClick,
  label = 'Buy now',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-cta-deep disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Processing&hellip;</span>
        </>
      ) : (
        <>
          <Lock className="h-4 w-4 opacity-90" aria-hidden="true" />
          <span>{label}</span>
          <span className="text-sm font-normal text-white/80">| ${formatMoney(price)}</span>
        </>
      )}
    </button>
  );
};
