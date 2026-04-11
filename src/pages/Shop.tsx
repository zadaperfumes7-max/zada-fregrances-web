import { useState, useEffect } from "react";
import { motion } from "motion/react";
import ProductGrid from "../components/ProductGrid";
import { Search, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import SEO from "../components/SEO";

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = ["All", ...snapshot.docs.map(doc => doc.data().name)];
      setCategories(cats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 min-h-screen"
    >
      <SEO 
        title="Shop Luxury Collection"
        description="Browse ZADA's curated collection of artisanal fragrances. Find your signature scent from our exclusive range."
      />
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass rounded-[3rem] p-12 md:p-20 mb-12">
          <h1 className="text-5xl md:text-7xl font-serif mb-8">The Collection</h1>
          <p className="text-white/60 text-lg max-w-2xl font-light leading-relaxed">
            Explore our complete range of artisanal fragrances. From deep, woody ouds to fresh, citrus mists, find the scent that defines you.
          </p>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-grow glass rounded-full px-8 py-4 flex items-center gap-4">
            <Search size={20} className="text-white/40" />
            <input 
              type="text" 
              placeholder="Search for a scent, note, or collection..." 
              className="bg-transparent w-full focus:outline-none text-white placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="relative group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none glass rounded-full px-12 py-4 flex items-center gap-3 font-bold hover:bg-white/20 transition-all cursor-pointer focus:outline-none"
              >
                <option value="newest" className="bg-black">Newest</option>
                <option value="price-low" className="bg-black">Price: Low to High</option>
                <option value="price-high" className="bg-black">Price: High to Low</option>
                <option value="rating" className="bg-black">Top Rated</option>
              </select>
              <SlidersHorizontal size={18} className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar min-h-[60px] items-center">
          {loading ? (
            <Loader2 className="animate-spin text-silver" size={24} />
          ) : (
            categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all ${
                  selectedCategory === cat ? "bg-white text-black" : "glass hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>

        <ProductGrid category={selectedCategory} searchTerm={searchTerm} sortBy={sortBy} />
      </div>
    </motion.div>
  );
}
