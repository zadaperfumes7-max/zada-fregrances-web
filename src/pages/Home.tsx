import { motion } from "motion/react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import SEO from "../components/SEO";

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SEO 
        title="ZADA | Luxury Artisanal Fragrances"
        description="Discover ZADA's exclusive collection of luxury artisanal perfumes. Crafted with soul and science for pure elegance."
      />
      
      {/* JSON-LD Structured Data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          "name": "ZADA Fragrances",
          "description": "Luxury artisanal perfumes and fragrances.",
          "url": "https://zadafragrances.com/",
          "telephone": "+1234567890",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Luxury Lane",
            "addressLocality": "Cairo",
            "addressCountry": "EG"
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
              ],
              "opens": "00:00",
              "closes": "23:59"
            }
          ]
        })}
      </script>

      <Hero />
      
      {/* Decorative Section Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <ProductGrid />

      {/* Brand Story Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto glass rounded-[3rem] overflow-hidden flex flex-col lg:flex-row">
          <div className="lg:w-1/2 h-[400px] lg:h-auto">
            <img 
              src="https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&q=80&w=1200" 
              alt="Perfume Making" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="lg:w-1/2 p-12 md:p-20 flex flex-col justify-center">
            <h3 className="text-silver uppercase tracking-[0.2em] text-xs font-bold mb-6">Our Philosophy</h3>
            <h2 className="text-4xl md:text-5xl font-serif mb-8 leading-tight">Crafted with <br /><span className="italic">Soul & Science</span></h2>
            <p className="text-white/60 text-lg font-light leading-relaxed mb-10">
              At Zada, we believe that a fragrance is more than just a scent—it's a signature, a memory, and an extension of your identity. Our master perfumers blend traditional techniques with modern innovation to create olfactory masterpieces.
            </p>
            <Link to="/shop" className="self-start px-10 py-4 glass rounded-full font-bold hover:bg-white hover:text-black transition-all duration-300">
              Read Our Story
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
