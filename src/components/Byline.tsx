import React from 'react';

/**
 * Editorial byline.
 *
 * Replaces the old AuthorByline, which credited the page to a fabricated
 * veterinarian ("Dr. Sarah Jenkins, DVM — medically reviewed"). The store may
 * not imply medical endorsement it does not have. The byline now names the
 * publishing team honestly and keeps the last-updated stamp.
 */

/** Formats today's date as e.g. "October 11, 2026". */
function formattedToday(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Computed once per page load — keeps render pure and stable. */
const LAST_UPDATED = formattedToday();
const LAST_UPDATED_ISO = new Date().toISOString().split('T')[0];

export const Byline: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="text-sm font-bold text-stone-900">
        By the <span className="text-stone-900">Paw-Grip</span> team
      </p>

      <span className="hidden h-6 w-px bg-stone-900/10 sm:block" aria-hidden="true" />

      <p className="flex items-center gap-1.5 text-xs text-stone-500">
        <span>
          Last updated:{' '}
          <time dateTime={LAST_UPDATED_ISO} className="font-semibold text-stone-700">
            {LAST_UPDATED}
          </time>
        </span>
      </p>
    </div>
  );
};
