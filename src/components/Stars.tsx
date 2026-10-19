import React from 'react';

/** Numeric rating. No review quote, no reviewer name. */
export const Stars: React.FC<{ value: number; count: number }> = ({ value, count }) => {
  if (count <= 0) return null;
  const full = Math.max(0, Math.min(5, Math.round(value)));
  const marks = '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(full);
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted">
      <span className="tracking-tight text-[#E0A100]" aria-hidden="true">
        {marks}
      </span>
      <span className="font-semibold tabular-nums text-ink">{value.toFixed(1)}</span>
      <span className="tabular-nums">({count})</span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5, from {count} ratings
      </span>
    </p>
  );
};
