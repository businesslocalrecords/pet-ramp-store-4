import React, { useEffect, useRef, useState } from 'react';

export interface GalleryPhoto {
  src: string;
  alt: string;
  label: string;
}

/**
 * Square photo strip with a large view. Opening a photo does not change the
 * address. Previous and Next sit under the photo on a white dialog.
 */
export const ProductPhotoGallery: React.FC<{ photos: readonly GalleryPhoto[] }> = ({ photos }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollLock = useRef(false);
  const active = photos[Math.min(activeIndex, photos.length - 1)];

  const goTo = (idx: number) => {
    const el = trackRef.current;
    scrollLock.current = true;
    setActiveIndex(idx);
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: 'auto' });
    window.setTimeout(() => {
      scrollLock.current = false;
    }, 80);
  };

  const openViewer = (idx: number) => {
    goTo(idx);
    setViewerOpen(true);
  };

  useEffect(() => {
    if (!viewerOpen) return;
    closeButtonRef.current?.focus();
  }, [viewerOpen]);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewerOpen(false);
      if (event.key === 'ArrowRight') goTo((activeIndex + 1) % photos.length);
      if (event.key === 'ArrowLeft') goTo((activeIndex - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, activeIndex, photos.length]);

  if (!active) return null;

  return (
    <div className="min-w-0">
      <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <div
          ref={trackRef}
          onScroll={() => {
            if (scrollLock.current) return;
            const el = trackRef.current;
            if (!el || el.clientWidth === 0) return;
            const idx = Math.round(el.scrollLeft / el.clientWidth);
            if (idx !== activeIndex) setActiveIndex(idx);
          }}
          className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-live="polite"
        >
          {photos.map((photo, idx) => (
            <div key={photo.src} className="aspect-square w-full shrink-0 snap-center bg-white">
              <button
                type="button"
                className="block h-full w-full"
                aria-label={`slide ${idx + 1} of ${photos.length}`}
                onClick={() => openViewer(idx)}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={1400}
                  height={1400}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className="h-full w-full object-contain"
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-muted">{active.label}</p>

      {photos.length > 1 && (
        <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
          {photos.map((photo, idx) => (
            <button
              key={photo.src}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`slide ${idx + 1} of ${photos.length}`}
              onClick={() => openViewer(idx)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ${
                idx === activeIndex ? 'ring-2 ring-pine' : 'ring-line'
              }`}
            >
              <img src={photo.src} alt="" width={128} height={128} loading="lazy" decoding="async" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4"
          role="presentation"
          onClick={() => setViewerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product photo"
            className="relative flex h-[min(90vh,860px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end px-1 py-1">
              <button
                ref={closeButtonRef}
                type="button"
                className="h-10 rounded-full px-3 text-sm font-semibold text-stone-700"
                onClick={() => setViewerOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
              <img src={active.src} alt={active.alt} className="max-h-full w-full object-contain" />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-stone-200 px-3 py-3">
              {photos.length > 1 ? (
                <button
                  type="button"
                  className="h-11 shrink-0 rounded-full border border-stone-300 bg-white px-4 text-sm font-bold text-stone-900"
                  onClick={() => goTo((activeIndex - 1 + photos.length) % photos.length)}
                >
                  Previous
                </button>
              ) : (
                <span />
              )}
              <p className="min-w-0 text-center text-sm font-semibold text-stone-600">{active.label}</p>
              {photos.length > 1 ? (
                <button
                  type="button"
                  className="h-11 shrink-0 rounded-full border border-stone-300 bg-white px-4 text-sm font-bold text-stone-900"
                  onClick={() => goTo((activeIndex + 1) % photos.length)}
                >
                  Next
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
