import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, PawPrint, Search, ShoppingCart, X } from 'lucide-react';
import { useCart } from '../lib/cart-context';
import { CartDrawer } from './CartDrawer';
import { AnnouncementBar } from './AnnouncementBar';
import { Footer } from './Footer';

const LINKS = [
  { to: '/dog-ramps', label: 'Shop ramps' },
  { to: '/guide/how-to-choose-a-dog-car-ramp', label: 'How to choose' },
  { to: '/contact', label: 'Support' },
];

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { totalQuantity } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const params = new URLSearchParams(search);

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get('q') ?? '').trim();
    const next = new URLSearchParams(search);
    if (q) next.set('q', q);
    else next.delete('q');
    setMenuOpen(false);
    navigate({ pathname: '/dog-ramps', search: next.toString() });
  }

  return (
    <div className="min-h-screen bg-white text-[#14202B] antialiased">
      <header className="sticky top-0 z-40 border-b border-[#E4EAEB] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            to={{ pathname: '/', search }}
            className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E62]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F6E62]">
              <PawPrint className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Paw-Grip</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-6 md:flex" aria-label="Shop">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={{ pathname: link.to, search }}
                className={({ isActive }) =>
                  `text-sm font-semibold ${isActive ? 'text-[#0F6E62]' : 'text-[#14202B] hover:text-[#0F6E62]'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <form onSubmit={onSearch} className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-sm" role="search">
            <label className="relative block">
              <span className="sr-only">Search ramps and stairs</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6B73]" aria-hidden="true" />
              <input
                name="q"
                defaultValue={params.get('q') ?? ''}
                placeholder="Search ramps and stairs"
                className="h-10 w-full rounded-full border border-[#E4EAEB] bg-[#F3F6F7] pl-9 pr-4 text-sm outline-none focus:border-[#0F6E62] focus:bg-white"
              />
            </label>
          </form>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="ml-auto flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold md:ml-2"
            aria-label={totalQuantity > 0 ? `View cart, ${totalQuantity} items` : 'View cart'}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {totalQuantity > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F37021] px-1 text-xs text-white">
                {totalQuantity}
              </span>
            )}
          </button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <form onSubmit={onSearch} className="border-t border-[#E4EAEB] px-4 py-2 md:hidden" role="search">
          <label className="relative block">
            <span className="sr-only">Search ramps and stairs</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C6B73]" aria-hidden="true" />
            <input
              name="q"
              defaultValue={params.get('q') ?? ''}
              placeholder="Search ramps and stairs"
              className="h-10 w-full rounded-full border border-[#E4EAEB] bg-[#F3F6F7] pl-9 pr-4 text-sm outline-none focus:border-[#0F6E62] focus:bg-white"
            />
          </label>
        </form>

        {menuOpen && (
          <nav className="border-t border-[#E4EAEB] px-4 py-3 md:hidden" aria-label="Shop">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={{ pathname: link.to, search }}
                className="block py-3 text-base font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <AnnouncementBar />
      {children}
      <Footer />
      {cartOpen && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
    </div>
  );
};
