/**
 * PawGrip click log — the same visit tracking the root domain runs
 * (e.g. businesslocalrecords.com/chicago).
 *
 * POSTs the current path to `/track.php` (public/track.php, deployed with
 * the site), a small PHP endpoint that appends one pipe-delimited line per
 * visit — ET timestamp, city (from ?city= or the first path segment), IP,
 * path, user agent — to clicks.txt next to itself on the host.
 *
 * Fire-and-forget by design: tracking must never block rendering or throw
 * into the page.
 */
export function trackClick(): void {
  if (typeof window === 'undefined') return;

  const path = window.location.pathname + window.location.search;
  const body = new URLSearchParams({ path });
  const url = '/track.php';

  try {
    // sendBeacon survives page unload and sends the body as
    // application/x-www-form-urlencoded — exactly what $_POST reads.
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, body);
      return;
    }
  } catch {
    // fall through to fetch
  }

  try {
    void fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // tracking must never break the page
  }
}
