import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md glass-dark z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-silver" />
                <h2 className="text-2xl font-serif">Your Bag</h2>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold">
                  {totalItems}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-50">
                  <ShoppingBag size={64} strokeWidth={1} />
                  <div>
                    <p className="text-xl font-serif mb-1">Your bag is empty</p>
                    <p className="text-sm font-light">Add some fragrances to get started</p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-8 py-3 glass rounded-full font-bold hover:bg-white hover:text-black transition-all"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 group"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden glass flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-serif text-lg leading-tight">{item.name}</h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-white/20 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {item.sizeLabel && (
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">
                              Size: {item.sizeLabel}
                            </p>
                          )}
                          <p className="text-silver font-medium">{item.price.toLocaleString()} EGP</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center glass rounded-full px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:text-silver transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:text-silver transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-white/60 font-light uppercase tracking-widest text-xs">Subtotal</span>
                  <span className="text-2xl font-serif">{totalPrice.toLocaleString()} EGP</span>
                </div>
                <Link 
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-silver hover:text-black transition-all duration-300 shadow-xl shadow-silver/10 flex items-center justify-center"
                >
                  Checkout Now
                </Link>
                <p className="text-center text-[10px] text-white/30 uppercase tracking-widest mt-4">
                  Free shipping on all luxury orders
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
