import { Link } from "react-router-dom";
import { auth, loginWithGoogle, logout } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";

export default function Footer() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === "zada.perfumes7@gmail.com";

  return (
    <footer className="py-20 px-6 mt-20">
      <div className="max-w-7xl mx-auto glass rounded-[3rem] p-12 md:p-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="lg:col-span-1">
            <h2 className="text-3xl font-serif font-bold mb-6">ZADA</h2>
            <p className="text-white/50 font-light leading-relaxed">
              Crafting timeless scents for the modern individual. Experience luxury in every drop.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-8">Shop</h4>
            <ul className="space-y-4 text-white/50 font-light">
              <li><Link to="/shop" className="hover:text-white transition-colors">All Fragrances</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Gift Sets</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Home Scents</Link></li>
              <li><Link to="/shop" className="hover:text-white transition-colors">Samples</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-8">Support</h4>
            <ul className="space-y-4 text-white/50 font-light">
              <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Exchanges</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest mb-8">Newsletter</h4>
            <p className="text-white/50 font-light mb-6">Join our circle for exclusive offers and scent stories.</p>
            <div className="relative max-w-sm lg:max-w-none">
              <input 
                type="email" 
                placeholder="Your email" 
                className="w-full bg-white/5 border border-white/10 rounded-full pl-6 pr-28 py-4 text-sm focus:outline-none focus:border-white/50 transition-all placeholder:text-white/20"
              />
              <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-white text-black rounded-full px-6 text-[10px] font-bold uppercase tracking-widest hover:bg-silver transition-all">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-white/30 text-[10px] font-medium uppercase tracking-widest">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <p>© 2026 Zada Fragrances. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-white/20 lowercase">{user.email}</span>
                {isAdmin && <Link to="/admin" className="text-orange-500/50 hover:text-orange-500 transition-colors">Admin Panel</Link>}
                <button onClick={() => logout()} className="hover:text-white transition-colors">Logout</button>
              </div>
            ) : (
              <button onClick={() => loginWithGoogle()} className="text-white/5 hover:text-white/20 transition-colors">Staff Login</button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
