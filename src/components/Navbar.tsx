import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Search, Menu, User, ShieldCheck, Heart, X, ChevronRight, LogOut, Info, Phone, MessageSquare } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, loginWithGoogle, logout } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsSearchOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleAuth = async () => {
    if (user) {
      try {
        await logout();
        toast.success("Logged out successfully");
      } catch (error) {
        toast.error("Error logging out");
      }
    } else {
      try {
        await loginWithGoogle();
        toast.success("Logged in successfully");
      } catch (error: any) {
        console.error("Login error:", error);
        toast.error(error.message || "Error logging in");
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isAdmin = user?.email === "zada.perfumes7@gmail.com";

  return (
    <>
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4"
    >
      <div className="max-w-7xl mx-auto glass rounded-2xl px-6 md:px-8 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-serif font-bold tracking-tighter text-glow text-white">ZADA</Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
            <Link 
              to="/shop" 
              className={`hover:text-white transition-colors ${location.pathname === '/shop' ? 'text-white' : ''}`}
            >
              Collections
            </Link>
            <Link 
              to="/wishlist" 
              className={`hover:text-white transition-colors ${location.pathname === '/wishlist' ? 'text-white' : ''}`}
            >
              Wishlist
            </Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-silver hover:text-silver-light transition-colors font-bold"
              >
                <ShieldCheck size={16} />
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <Search size={20} />
          </button>
          
          {/* Desktop Only Actions */}
          <div className="hidden md:flex items-center gap-5">
            <Link 
              to="/wishlist"
              className="p-2 hover:bg-white/10 rounded-full transition-colors relative text-white/70 hover:text-white"
            >
              <Heart size={20} className={wishlist.length > 0 ? "fill-silver text-silver" : ""} />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-silver rounded-full text-[10px] flex items-center justify-center font-bold text-black">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button 
              onClick={handleAuth}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
            >
              {user ? (
                <img src={user.photoURL || ""} alt="Profile" className="w-8 h-8 rounded-full border border-white/20" />
              ) : (
                <User size={20} />
              )}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors relative text-white/70 hover:text-white"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-silver rounded-full text-[10px] flex items-center justify-center font-bold text-black">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </motion.nav>

    {/* Search Overlay */}
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 md:pt-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            className="relative w-full max-w-2xl"
          >
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={24} />
              <input 
                autoFocus
                type="text" 
                placeholder="What scent are you looking for?"
                className="w-full bg-white/10 border border-white/20 rounded-[2rem] py-6 pl-16 pr-20 text-xl md:text-2xl focus:outline-none focus:border-silver transition-all text-white placeholder:text-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </form>
            <p className="mt-4 px-6 text-white/20 text-sm font-medium uppercase tracking-widest text-center">Press Enter to Explore</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Mobile Side Menu */}
    <AnimatePresence>
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm glass-dark border-l border-white/10 flex flex-col p-8"
          >
            <div className="flex items-center justify-between mb-12">
              <span className="text-2xl font-serif font-bold tracking-tighter text-white">ZADA</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow space-y-2">
              {[
                { label: "Home", path: "/", icon: ShieldCheck }, // Dummy icon if none
                { label: "Our Collection", path: "/shop", subtitle: "Browse All Scents" },
                { label: "Your Wishlist", path: "/wishlist", badge: wishlist.length },
                ...(isAdmin ? [{ label: "Admin Panel", path: "/admin", special: true }] : []),
              ].map((item, idx) => (
                <Link 
                  key={idx}
                  to={item.path!} 
                  className="group flex flex-col p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-medium ${item.special ? 'text-silver' : 'text-white'}`}>
                      {item.label}
                    </span>
                    <ChevronRight size={18} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  {item.subtitle && <span className="text-xs text-white/20 mt-1">{item.subtitle}</span>}
                </Link>
              ))}
            </div>

            <div className="mt-auto space-y-6 pt-8 border-t border-white/10">
              <div className="flex flex-col gap-4">
                <button className="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm font-medium">
                  <Info size={18} /> Our Story
                </button>
                <button className="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm font-medium">
                  <Phone size={18} /> Contact Us
                </button>
              </div>

              {user ? (
                <div className="glass p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || ""} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName}</span>
                      <button onClick={handleAuth} className="text-[10px] text-silver font-bold uppercase tracking-widest text-left">Sign Out</button>
                    </div>
                  </div>
                  <LogOut size={16} className="text-white/20" />
                </div>
              ) : (
                <button 
                  onClick={handleAuth}
                  className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-silver transition-all shadow-xl shadow-white/5"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
