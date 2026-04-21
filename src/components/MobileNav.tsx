import { motion } from "motion/react";
import { Home, Compass, Heart, ShoppingBag, User, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { auth } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";

export default function MobileNav() {
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === "zada.perfumes7@gmail.com";

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Shop", path: "/shop" },
    { icon: Heart, label: "Wishlist", path: "/wishlist", badge: wishlist.length },
    { icon: ShoppingBag, label: "Cart", onClick: () => setIsCartOpen(true), badge: totalItems },
    ...(isAdmin ? [{ icon: ShieldCheck, label: "Admin", path: "/admin" }] : [{ icon: User, label: "Profile", path: "/profile" }]),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] px-4 pb-6 pt-2 pointer-events-none">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="max-w-md mx-auto glass-dark border border-white/10 rounded-[2.5rem] flex items-center justify-around p-2 pointer-events-auto shadow-2xl backdrop-blur-3xl shadow-black/50"
      >
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const content = (
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl relative"
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-white text-black' : 'text-white/40'}`}>
                <Icon size={20} className={isActive ? "fill-current" : ""} />
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-silver rounded-full text-[8px] flex items-center justify-center font-bold text-black border border-black shadow-lg">
                  {item.badge}
                </span>
              )}
            </motion.div>
          );

          if (item.onClick) {
            return (
              <button key={idx} onClick={item.onClick}>
                {content}
              </button>
            );
          }

          return (
            <Link key={idx} to={item.path!}>
              {content}
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
