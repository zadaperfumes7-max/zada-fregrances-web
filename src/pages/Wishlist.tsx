import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingCart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Wishlist() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  const handleMoveToCart = (product: any) => {
    const sizeToUse = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    addToCart(product, sizeToUse);
    removeFromWishlist(product.id);
    setIsCartOpen(true);
    toast.success(`${product.name} moved to bag!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <h1 className="text-5xl md:text-6xl font-serif mb-4">Your Wishlist</h1>
          <p className="text-white/50 text-lg max-w-2xl">
            A curated collection of your favorite fragrances. Save them for later or add them to your bag.
          </p>
        </header>

        {wishlist.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[3rem] p-16 text-center"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart size={40} className="text-white/20" />
            </div>
            <h2 className="text-3xl font-serif mb-4">Your wishlist is empty</h2>
            <p className="text-white/40 mb-12 max-w-md mx-auto">
              Explore our exquisite collection and save the scents that speak to you.
            </p>
            <Link 
              to="/shop" 
              className="inline-flex items-center gap-2 px-12 py-5 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              Start Shopping
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {wishlist.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass rounded-[2.5rem] overflow-hidden p-6 group"
                >
                  <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-6">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur-md text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mb-8">
                    <span className="text-orange-400 text-[10px] uppercase tracking-widest font-bold mb-2 block">
                      {product.category}
                    </span>
                    <h3 className="text-2xl font-serif mb-2">{product.name}</h3>
                    <p className="text-xl font-light text-white/80">{product.price.toLocaleString()} EGP</p>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleMoveToCart(product)}
                      className="flex-grow py-4 bg-white text-black rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-orange-500 hover:text-white transition-all"
                    >
                      <ShoppingBag size={18} />
                      Move to Bag
                    </button>
                    <button 
                      onClick={() => {
                        const sizeToUse = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
                        addToCart(product, sizeToUse);
                        setIsCartOpen(true);
                      }}
                      className="p-4 glass rounded-2xl hover:bg-white/10 transition-all text-white/60 hover:text-white"
                      title="Add to Bag"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
