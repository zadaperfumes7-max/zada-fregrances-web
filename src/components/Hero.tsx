import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, User } from "lucide-react";
import { Link } from "react-router-dom";
import { auth, loginWithGoogle } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";

export default function Hero() {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === "zada.perfumes7@gmail.com";

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/bg.png" 
          alt="Luxury Perfume" 
          className="w-full h-full object-cover opacity-60 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-dark p-12 md:p-20 rounded-[3rem] max-w-4xl mx-auto"
        >
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-silver uppercase tracking-[0.3em] text-xs font-bold mb-6 block"
          >
            Exquisite Fragrances
          </motion.span>
          <h2 className="text-5xl md:text-8xl font-serif font-light mb-8 leading-tight">
            The Essence of <br />
            <span className="italic font-normal">Pure Elegance</span>
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Discover a world where scent meets soul. Zada Fragrances brings you the most exclusive collection of artisanal perfumes.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link to="/shop" className="px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-silver hover:text-black transition-all duration-300 flex items-center gap-2 group">
              Shop Collection
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {isAdmin && (
              <Link to="/admin" className="px-10 py-4 glass rounded-full font-bold hover:bg-silver/20 transition-all duration-300 flex items-center gap-2 text-silver">
                <ShieldCheck size={18} />
                Admin Dashboard
              </Link>
            )}
            
            {!isAdmin && (
              <Link to="/shop" className="px-10 py-4 glass rounded-full font-bold hover:bg-white/20 transition-all duration-300">
                View Lookbook
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Floating Elements for depth */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-20 hidden lg:block"
      >
        <div className="glass w-32 h-32 rounded-3xl rotate-12" />
      </motion.div>
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-40 right-20 hidden lg:block"
      >
        <div className="glass w-24 h-24 rounded-full" />
      </motion.div>
    </section>
  );
}
