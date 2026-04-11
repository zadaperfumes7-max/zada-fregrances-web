import { motion } from "motion/react";
import { ShoppingBag, Search, Menu, User, ShieldCheck, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { auth, loginWithGoogle, logout } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

export default function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
      } catch (error) {
        toast.error("Error logging in");
      }
    }
  };

  const isAdmin = user?.email === "zada.perfumes7@gmail.com";

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto glass rounded-2xl px-8 py-4 flex items-center justify-between">
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

        <div className="flex items-center gap-5">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
            <Search size={20} />
          </button>
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
          <button className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
