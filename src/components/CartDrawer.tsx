import React from 'react';
import { X } from 'lucide-react';
import { useCart } from '../lib/cart-context';
import { usePurchase } from '../lib/purchase-context';
import { formatMoney } from '../lib/offers';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ open, onClose }) => {
  const { cart, loading, error, removeItem } = useCart();
  const { buy } = usePurchase();

  if (!open) return null;

  const handleRemoveItem = async (lineId: string) => {
    try {
      await removeItem(lineId);
    } catch (err) {
      console.error('Failed to remove item:', err);
      // In a production app, we might want to show a toast or error message
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="flex items-center justify-center w-full">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      </div>
      
      {/* Drawer */}
      <div className="w-full max-w-xs bg-white border-t border-l-4 border-l-indigo-600 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-stone-900">Your Cart</h2>
          <button className="text-stone-500 hover:text-stone-900" onClick={onClose} aria-label="Close cart">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Cart Contents */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center py-8">Loading cart...</p>
          ) : error ? (
            <p className="text-center text-red-600 py-8">Error loading cart</p>
          ) : !cart || cart.totalQuantity === 0 ? (
            <p className="text-center text-stone-500 py-8">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cart.lines.edges.map((edge) => (
                <div key={edge.node.id} className="flex items-start gap-4 pb-3 border-b">
                  {/* Product Image - placeholder since we don't have image in cart line */}
                  <div className="flex-shrink-0 h-12 w-12 bg-stone-50 rounded">
                    <span className="text-stone-400">📦</span>
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 flex-col">
                    <p className="font-medium text-stone-900 line-clamp-1">
                      {edge.node.merchandise.product.title} - {edge.node.merchandise.title}
                    </p>
                    <p className="text-sm text-stone-500">
                      Quantity: {edge.node.quantity}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">
                      {formatMoney(
                        parseFloat(edge.node.cost.totalAmount.amount) / edge.node.quantity
                      )} each
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(edge.node.id)}
                    className="text-stone-500 hover:text-stone-900"
                  >
                    <span className="text-xs">Remove</span>
                  </button>
                </div>
              ))}
              
              {/* Summary */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-stone-700">Subtotal:</span>
                  <span className="font-medium text-stone-900">
                    {formatMoney(parseFloat(cart.cost.subtotalAmount.amount))}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-stone-700">Total:</span>
                  <span className="font-medium text-lg text-stone-900">
                    {formatMoney(parseFloat(cart.cost.totalAmount.amount))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t">
          {cart && cart.totalQuantity > 0 ? (
            <>
              <button
                onClick={buy}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#F37021] text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-[#D95E1A] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                    Processing…
                  </>
                ) : (
                  <>
                    <span className="hidden md:inline-flex">Checkout</span>
                    <span className="md:hidden">
                      <span className="h-3 w-3">⚡</span>
                    </span>
                  </>
                )}
              </button>
              
              <button
                onClick={onClose}
                className="w-full mt-2 flex items-center justify-center text-sm font-medium text-stone-600 hover:text-stone-900"
              >
                Continue shopping
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};