import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { ShoppingCart, Star, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  rating: number;
}

interface ProductGridProps {
  category?: string;
  searchTerm?: string;
  sortBy?: string;
}

export default function ProductGrid({ category = "All", searchTerm = "", sortBy = "newest" }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
    addToCart(product);
    setIsCartOpen(true);
    toast.success(`${product.name} added to cart!`, {
      description: "You can view your bag in the cart menu.",
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
                <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden mb-6">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
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
                <p className="text-lg font-light text-white/80">{product.price.toLocaleString()} EGP</p>
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
);
}
