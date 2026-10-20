import { useEffect } from 'react';
import { canonicalUrl, seoFor } from './seo';

function meta(selector: string, create: () => HTMLMetaElement, content: string) {
  const found = document.head.querySelector(selector);
  const el = found instanceof HTMLMetaElement ? found : create();
  if (!(found instanceof HTMLMetaElement)) document.head.appendChild(el);
  el.content = content;
}

/**
 * Keeps the document head aligned with `seo.ts` after a client-side navigation.
 * The static shell already has the tags for the first response.
 */
export function usePageMeta(pathname: string): void {
  useEffect(() => {
    const route = seoFor(pathname);
    if (!route) return;

    document.title = route.title;
    meta('meta[name="description"]', () => {
      const el = document.createElement('meta');
      el.name = 'description';
      return el;
    }, route.description);
    meta('meta[name="keywords"]', () => {
      const el = document.createElement('meta');
      el.name = 'keywords';
      return el;
    }, route.keywords);

    const url = canonicalUrl(route);
    const foundCanonical = document.head.querySelector('link[rel="canonical"]');
    const canonical = foundCanonical instanceof HTMLLinkElement ? foundCanonical : document.createElement('link');
    if (!(foundCanonical instanceof HTMLLinkElement)) {
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const properties: [string, string][] = [
      ['og:title', route.title],
      ['og:description', route.description],
      ['og:url', url],
      ['og:image', route.image],
      ['og:type', route.price ? 'product' : 'website'],
    ];
    for (const [property, content] of properties) {
      meta(`meta[property="${property}"]`, () => {
        const el = document.createElement('meta');
        el.setAttribute('property', property);
        return el;
      }, content);
    }

    const names: [string, string][] = [
      ['twitter:title', route.title],
      ['twitter:description', route.description],
      ['twitter:image', route.image],
    ];
    for (const [name, content] of names) {
      meta(`meta[name="${name}"]`, () => {
        const el = document.createElement('meta');
        el.name = name;
        return el;
      }, content);
    }

    if (route.price) {
      meta('meta[property="product:price:amount"]', () => {
        const el = document.createElement('meta');
        el.setAttribute('property', 'product:price:amount');
        return el;
      }, route.price);
      meta('meta[property="product:price:currency"]', () => {
        const el = document.createElement('meta');
        el.setAttribute('property', 'product:price:currency');
        return el;
      }, 'USD');
    }

    const foundScript = document.getElementById('seo-jsonld');
    const script = foundScript instanceof HTMLScriptElement ? foundScript : document.createElement('script');
    if (!(foundScript instanceof HTMLScriptElement)) {
      script.id = 'seo-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(route.jsonLd);
  }, [pathname]);
}
