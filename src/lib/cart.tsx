import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { createCart, addToCart, getCart, updateCartLines, removeFromCart, type Cart, type CartLine } from './shopify';
import { CartContext, CART_ID_KEY, type CartContextValue } from './cart-context';

/**
 * Global cart provider.
 * Persists the Shopify cart ID to localStorage so carts survive page reloads.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    const storedCartId = localStorage.getItem(CART_ID_KEY);
    if (storedCartId) {
      const existingCart = await getCart(storedCartId).catch(() => null);
      if (existingCart) {
        // Heal stale residue (phantom "1 in cart" on landing).
        //
        // `buy()` builds a throwaway checkout cart and redirects to Shopify; it
        // never persists that cart (see startCheckout). The only writer of this
        // key besides loadCart itself is an add-to-cart flow — and this page has
        // none. An earlier build DID persist the throwaway checkout cart here,
        // so any visitor who reached checkout has a stale id cached that still
        // holds the ramp. A hydrated browsing cart that already has items is
        // therefore always that stale residue: drop it and start a clean, empty
        // cart so the header badge correctly reads 0 on arrival.
        if (existingCart.totalQuantity > 0) {
          localStorage.removeItem(CART_ID_KEY);
        } else {
          setCart(existingCart);
          setLoading(false);
          return;
        }
      } else {
        localStorage.removeItem(CART_ID_KEY);
      }
    }
    const newCart = await createCart();
    localStorage.setItem(CART_ID_KEY, newCart.id);
    setCart(newCart);
    setLoading(false);
  }, []);

  // Hydrate or create the cart on mount (async, so no cascading render).
  useEffect(() => {
    loadCart().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to initialize cart');
      setLoading(false);
    });
  }, [loadCart]);

  const refreshCart = useCallback(async () => {
    const storedCartId = localStorage.getItem(CART_ID_KEY);
    if (storedCartId) {
      try {
        const existingCart = await getCart(storedCartId);
        if (existingCart) {
          setCart(existingCart);
          return;
        }
        localStorage.removeItem(CART_ID_KEY);
      } catch {
        localStorage.removeItem(CART_ID_KEY);
      }
    }
    await loadCart();
  }, [loadCart]);

  const startCheckout = useCallback(async (lines: CartLine[], discountCodes: string[] = []) => {
    setLoading(true);
    setError(null);
    try {
      const checkoutCart = await createCart(lines, discountCodes);
      // NOTE: deliberately do NOT persist this checkout cart's ID to
      // localStorage. `buy()` builds a throwaway one-and-done cart purely to
      // obtain a checkoutUrl, then redirects to Shopify. Persisting it here is
      // what caused the phantom "1 in cart" on the next visit: on return,
      // loadCart() rehydrated that completed/abandoned cart (still holding the
      // ramp) and the header badge showed 1 before the visitor did anything.
      // The persistent browsing cart stays the empty one created on load.
      setCart(checkoutCart);
      return checkoutCart;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback<CartContextValue['addItem']>(
    async (merchandiseId, quantity = 1, attributes) => {
      let currentCart = cart;
      if (!currentCart) {
        await loadCart();
        const storedCartId = localStorage.getItem(CART_ID_KEY);
        if (storedCartId) {
          currentCart = await getCart(storedCartId);
        }
        if (!currentCart) {
          throw new Error('Unable to initialize cart. Please refresh and try again.');
        }
      }

      setLoading(true);
      setError(null);
      try {
        const lines: CartLine[] = [{ merchandiseId, quantity, attributes }];
        const updatedCart = await addToCart(currentCart.id, lines);
        setCart(updatedCart);

        // Google Ads / GA4 AddToCart
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'add_to_cart', {
            currency: updatedCart.cost.totalAmount.currencyCode,
            value: parseFloat(updatedCart.cost.totalAmount.amount),
            items: [{ item_id: merchandiseId, quantity, price: parseFloat(updatedCart.cost.totalAmount.amount) / quantity }],
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to cart');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cart, loadCart]
  );

  const updateQuantity = useCallback<CartContextValue['updateQuantity']>(
    async (lineId, quantity) => {
      if (!cart) return;
      setLoading(true);
      setError(null);
      try {
        setCart(await updateCartLines(cart.id, [{ id: lineId, quantity }]));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update cart');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cart]
  );

  const removeItem = useCallback<CartContextValue['removeItem']>(
    async (lineId) => {
      if (!cart) return;
      setLoading(true);
      setError(null);
      try {
        setCart(await removeFromCart(cart.id, [lineId]));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove item');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cart]
  );

  const clearCart = useCallback(async () => {
    localStorage.removeItem(CART_ID_KEY);
    await loadCart();
  }, [loadCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        startCheckout,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        checkoutUrl: cart?.checkoutUrl ?? null,
        totalQuantity: cart?.totalQuantity ?? 0,
        subtotal: cart?.cost.subtotalAmount ?? { amount: '0', currencyCode: 'USD' },
      }}
    >
      {children}
    </CartContext.Provider>
  );
}