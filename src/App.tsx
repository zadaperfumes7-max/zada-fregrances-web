import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminCustomers from "./pages/AdminCustomers";
import AdminDiscounts from "./pages/AdminDiscounts";
import AdminSettings from "./pages/AdminSettings";
import AdminCategories from "./pages/AdminCategories";
import AuthGuard from "./components/AuthGuard";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import CartDrawer from "./components/CartDrawer";
import CinematicIntro from "./components/CinematicIntro";
import Wishlist from "./pages/Wishlist";
import MobileNav from "./components/MobileNav";

function PageWrapper({ children, showNav = true }: { children: React.ReactNode, showNav?: boolean }) {
  return (
    <>
      {showNav && <Navbar />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
      {showNav && <Footer />}
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/shop" element={<PageWrapper><Shop /></PageWrapper>} />
        <Route path="/wishlist" element={<PageWrapper><Wishlist /></PageWrapper>} />
        <Route path="/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AuthGuard requireAdmin>
            <AdminDashboard />
          </AuthGuard>
        } />
        <Route path="/admin/products" element={
          <AuthGuard requireAdmin>
            <AdminProducts />
          </AuthGuard>
        } />
        <Route path="/admin/orders" element={
          <AuthGuard requireAdmin>
            <AdminOrders />
          </AuthGuard>
        } />
        <Route path="/admin/customers" element={
          <AuthGuard requireAdmin>
            <AdminCustomers />
          </AuthGuard>
        } />
        <Route path="/admin/discounts" element={
          <AuthGuard requireAdmin>
            <AdminDiscounts />
          </AuthGuard>
        } />
        <Route path="/admin/categories" element={
          <AuthGuard requireAdmin>
            <AdminCategories />
          </AuthGuard>
        } />
        <Route path="/admin/settings" element={
          <AuthGuard requireAdmin>
            <AdminSettings />
          </AuthGuard>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("hasSeenIntro", "true");
    setShowIntro(false);
  };

  return (
    <Router>
      <WishlistProvider>
        <CartProvider>
          <div className="relative min-h-screen selection:bg-silver/30 pb-20 md:pb-0">
          <AnimatePresence>
            {showIntro && (
              <CinematicIntro onComplete={handleIntroComplete} />
            )}
          </AnimatePresence>
          <Toaster position="top-center" expand={false} richColors />
          <CartDrawer />
          <MobileNav />
          <AnimatedRoutes />
        </div>
      </CartProvider>
    </WishlistProvider>
  </Router>
);
}
