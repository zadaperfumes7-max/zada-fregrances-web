import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState } from "react";
import { ShoppingCart, Star, Loader2, Heart, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

interface ProductSize {
  label: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  images?: string[];
  description?: string;
  rating: number;
  sizes?: ProductSize[];
}

interface ProductGridProps {
  category?: string;
  searchTerm?: string;
  sortBy?: string;
}

export default function ProductGrid({ category = "All", searchTerm = "", sortBy = "newest" }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, ProductSize>>({});
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return (b.rating || 5) - (a.rating || 5);
    // Default to newest (handled by Firestore query but good to have fallback)
    return 0;
  });

  const handleAddToCart = (product: Product) => {
    const selectedSize = selectedSizes[product.id];
    
    // If product has sizes but none selected, default to first size
    const sizeToUse = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
    
    addToCart(product, sizeToUse);
    setIsCartOpen(true);
    toast.success(`${product.name} added to cart!`, {
      description: sizeToUse ? `Size: ${sizeToUse.label}` : "Standard size added.",
    });
  };

  const toggleWishlist = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-silver" size={40} />
        <p className="text-white/50 font-serif italic">Loading our collection...</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="py-24 text-center">
        <h3 className="text-2xl font-serif mb-4">No products found</h3>
        <p className="text-white/50">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <>
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <h3 className="text-silver uppercase tracking-[0.2em] text-xs font-bold mb-4">
            {category === "All" ? "Featured Selection" : category}
          </h3>
          <h2 className="text-4xl md:text-5xl font-serif">
            {searchTerm ? `Results for "${searchTerm}"` : "Curated for You"}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product, index) => {
          const isWishlisted = isInWishlist(product.id);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="glass rounded-[2rem] overflow-hidden p-4 h-full flex flex-col transition-all duration-500 group-hover:bg-white/15">
                <div 
                  className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden mb-6 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={activeImageIndex[product.id] || 0}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      src={product.images?.[activeImageIndex[product.id] || 0] || product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                  
                  {/* Image Navigation Dots */}
                  {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {product.images.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(prev => ({ ...prev, [product.id]: dotIdx }));
                          }}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            (activeImageIndex[product.id] || 0) === dotIdx 
                              ? 'bg-white w-4' 
                              : 'bg-white/40 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      onClick={(e) => toggleWishlist(e, product)}
                      className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
                        isWishlisted 
                          ? 'bg-silver text-black shadow-lg shadow-silver/30' 
                          : 'bg-black/20 text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      <Heart size={18} className={isWishlisted ? "fill-current" : ""} />
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                    <Star size={12} className="fill-silver text-silver" />
                    {product.rating || 5.0}
                  </div>
                </div>
              
                <div className="px-2 flex-grow">
                  <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2 block">
                    {product.category}
                  </span>
                  <h4 className="text-xl font-serif mb-2 group-hover:text-glow transition-all">
                    {product.name}
                  </h4>
                  <div className="flex flex-col gap-3">
                    <p className="text-lg font-light text-white/80">
                      {product.sizes && product.sizes.length > 0
                        ? `${(selectedSizes[product.id]?.price || product.price).toLocaleString()} EGP`
                        : `${product.price.toLocaleString()} EGP`
                      }
                    </p>
                    
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size.label}
                            onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
                            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border transition-all ${
                              (selectedSizes[product.id]?.label || product.sizes?.[0].label) === size.label
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              <button 
                onClick={() => handleAddToCart(product)}
                className="mt-6 w-full py-4 glass rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-white hover:text-black transition-all duration-300"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  </section>

    {/* Quick View Modal */}
    <AnimatePresence>
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProduct(null)}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-6xl glass-dark rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh] border border-white/10"
          >
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 z-20 p-3 bg-black/20 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
            >
              <X size={24} />
            </button>

            {/* Gallery Section */}
            <div className="w-full lg:w-1/2 bg-black/40 relative">
              <div className="h-[400px] lg:h-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeImageIndex[selectedProduct.id] || 0}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    src={selectedProduct.images?.[activeImageIndex[selectedProduct.id] || 0] || selectedProduct.image} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-contain p-12"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
              </div>

              {/* Thumbnail Strip */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-3 glass rounded-2xl border border-white/10">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(prev => ({ ...prev, [selectedProduct.id]: idx }))}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        (activeImageIndex[selectedProduct.id] || 0) === idx 
                          ? 'border-silver scale-110' 
                          : 'border-transparent opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="w-full lg:w-1/2 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex-grow">
                <div className="flex items-center gap-2 text-silver uppercase tracking-[0.2em] text-[10px] font-bold mb-4">
                  <Tag size={12} />
                  {selectedProduct.category}
                </div>
                <h2 className="text-4xl md:text-5xl font-serif mb-6">{selectedProduct.name}</h2>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-1 glass px-3 py-1.5 rounded-full text-xs font-bold text-silver">
                    <Star size={14} className="fill-current" />
                    {selectedProduct.rating || 5.0}
                  </div>
                  <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Handcrafted Presence</span>
                </div>

                <p className="text-white/60 leading-relaxed text-base italic font-serif mb-10">
                  {selectedProduct.description || "A masterfully blended essence that captures the duality of shadow and light. Each molecule is carefully selected to evoke a narrative of timeless elegance and mysterious allure."}
                </p>

                <div className="space-y-8">
                  {/* Size Selector */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Select Volume</label>
                      <div className="flex flex-wrap gap-3">
                        {selectedProduct.sizes.map((size) => (
                          <button
                            key={size.label}
                            onClick={() => setSelectedSizes(prev => ({ ...prev, [selectedProduct.id!]: size }))}
                            className={`px-6 py-3 rounded-2xl text-xs uppercase tracking-widest font-bold border transition-all ${
                              (selectedSizes[selectedProduct.id!]?.label || selectedProduct.sizes?.[0].label) === size.label
                                ? 'bg-silver text-black border-silver shadow-lg shadow-silver/20 scale-105'
                                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-baseline gap-4 mt-10">
                    <span className="text-4xl font-light text-white">
                      {selectedProduct.sizes && selectedProduct.sizes.length > 0
                        ? `${(selectedSizes[selectedProduct.id!]?.price || selectedProduct.price).toLocaleString()} EGP`
                        : `${selectedProduct.price.toLocaleString()} EGP`
                      }
                    </span>
                    <span className="text-white/20 line-through text-sm">
                      {((selectedSizes[selectedProduct.id!]?.price || selectedProduct.price) * 1.2).toLocaleString()} EGP
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                <button 
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="flex-grow py-5 bg-white text-black rounded-3xl flex items-center justify-center gap-3 font-bold hover:bg-silver transition-all duration-500 shadow-xl shadow-white/5 active:scale-95"
                >
                  <ShoppingCart size={20} />
                  Add to Collection
                </button>
                <button 
                  onClick={(e) => toggleWishlist(e, selectedProduct)}
                  className={`p-5 rounded-3xl glass transition-all duration-300 ${
                    isInWishlist(selectedProduct.id) ? 'text-silver border-silver fill-silver' : 'text-white/40 border-white/10'
                  }`}
                >
                  <Heart size={20} className={isInWishlist(selectedProduct.id) ? "fill-current" : ""} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
