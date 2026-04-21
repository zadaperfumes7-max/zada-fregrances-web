import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, User } from "lucide-react";
import { Link } from "react-router-dom";
import { auth, loginWithGoogle } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useEffect, useState } from "react";
import bgImage from "../assets/hero-background.png";

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
    <section className="relative h-[100dvh] flex items-center justify-center overflow-hidden pt-10 md:pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1920&auto=format&fit=crop";
          }}
          alt="Luxury Perfume" 
          className="w-full h-full object-cover opacity-70 scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050505]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass-dark p-8 md:p-20 rounded-[2.5rem] md:rounded-[3rem] max-w-4xl mx-auto backdrop-blur-2xl border border-white/5"
        >
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-silver uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-4 md:mb-6 block"
          >
            Exquisite Fragrances
          </motion.span>
          <h2 className="text-4xl md:text-8xl font-serif font-light mb-6 md:mb-8 leading-tight">
            The Essence of <br />
            <span className="italic font-normal">Pure Elegance</span>
          </h2>
          <p className="text-white/60 text-sm md:text-xl max-w-2xl mx-auto mb-8 md:mb-10 font-light leading-relaxed">
            Discover a world where scent meets soul. ZADA Fragrances brings you the most exclusive collection of artisanal perfumes.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <Link to="/shop" className="w-full md:w-auto px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-silver hover:text-black transition-all duration-300 flex items-center justify-center gap-2 group text-sm md:text-base">
              Shop Collection
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link to="/shop" className="w-full md:w-auto px-10 py-4 glass rounded-full font-bold hover:bg-white/20 transition-all duration-300 text-sm md:text-base">
              View Lookbook
            </Link>
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
