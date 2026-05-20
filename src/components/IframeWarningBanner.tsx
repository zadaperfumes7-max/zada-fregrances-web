import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Sparkles, X } from "lucide-react";

export default function IframeWarningBanner() {
  const [show, setShow] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setShow(true);
        setCurrentUrl(window.location.href);
      }
    } catch (e) {
      setShow(true);
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleOpenNewTab = () => {
    window.open(currentUrl, "_blank");
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative z-[999] bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-600/30 border-b border-orange-500/10 backdrop-blur-md px-4 py-2 text-center"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs md:text-sm font-light text-white/90">
          <span className="flex items-center gap-1.5 justify-center font-medium pr-1" dir="rtl">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>لتجربة تسوق وتسجيل دخول مثالية دون قيود المتصفح:</span>
          </span>
          <button
            onClick={handleOpenNewTab}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full flex items-center gap-1.5 transition-all outline-none duration-300 shadow-md shadow-amber-500/10 cursor-pointer text-xs uppercase tracking-wide"
          >
            <span>اضغط هنا لفتح المتجر في نافذة جديدة</span>
            <ExternalLink size={12} />
          </button>
          <button
            onClick={() => setShow(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white rounded-full hover:bg-white/5 transition-all"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
