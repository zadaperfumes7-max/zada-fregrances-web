import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../context/CartContext";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowLeft, CheckCircle2, Loader2, CreditCard, Truck, Tag, X } from "lucide-react";

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  // Settings & Discounts
  const [settings, setSettings] = useState({
    shippingFee: 0,
    taxRate: 0,
    currency: 'EGP'
  });
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          fullName: currentUser.displayName || "",
          email: currentUser.email || ""
        }));
      }
    });

    // Fetch settings
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    setIsCheckingDiscount(true);
    try {
      const q = query(
        collection(db, "discounts"), 
        where("code", "==", discountCode.toUpperCase()),
        where("active", "==", true)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.error("Invalid or expired discount code");
        setAppliedDiscount(null);
      } else {
        const discount = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        // Check expiry if exists
        if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) {
          toast.error("This discount code has expired");
          setAppliedDiscount(null);
        } else {
          setAppliedDiscount(discount);
          toast.success("Discount applied!");
        }
      }
    } catch (error) {
      toast.error("Error applying discount");
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percentage') {
      return (totalPrice * appliedDiscount.value) / 100;
    }
    return appliedDiscount.value;
  };

  const discountAmount = calculateDiscountAmount();
  const taxAmount = (totalPrice - discountAmount) * (settings.taxRate / 100);
  const finalTotal = totalPrice - discountAmount + taxAmount + settings.shippingFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to place an order");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        customerInfo: {
          ...formData,
          uid: user.uid
        },
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal: totalPrice,
        discount: {
          code: appliedDiscount?.code || null,
          amount: discountAmount
        },
        tax: taxAmount,
        shipping: settings.shippingFee,
        total: finalTotal,
        status: "pending",
        stockDecreased: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "orders"), orderData);
      
      setIsSuccess(true);
      clearCart();
      toast.success("Order placed successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "orders");
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-dark max-w-2xl w-full p-12 md:p-20 rounded-[3rem] text-center"
        >
          <div className="w-24 h-24 bg-silver rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-silver/20">
            <CheckCircle2 size={48} className="text-black" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif mb-6">Thank You</h1>
          <p className="text-white/60 text-lg mb-10 font-light leading-relaxed">
            Your order has been placed successfully. Our artisans are now preparing your exquisite selection. You will receive an email confirmation shortly.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/shop" className="px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-silver hover:text-black transition-all">
              Continue Shopping
            </Link>
            <Link to="/" className="px-10 py-4 glass rounded-full font-bold hover:bg-white/10 transition-all">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0 && !loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto mb-6 text-white/20" />
          <h2 className="text-3xl font-serif mb-4">Your bag is empty</h2>
          <p className="text-white/50 mb-8">Add some fragrances before checking out.</p>
          <Link to="/shop" className="px-10 py-4 bg-white text-black rounded-full font-bold hover:bg-silver hover:text-black transition-all">
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 glass rounded-full hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl md:text-6xl font-serif">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form */}
          <div className="lg:col-span-7 space-y-8">
            <section className="glass rounded-[2.5rem] p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-silver/20 rounded-full flex items-center justify-center text-silver">
                  <Truck size={20} />
                </div>
                <h2 className="text-2xl font-serif">Shipping Details</h2>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-white/40 ml-4">Full Name</label>
                    <input
                      required
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-silver/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-white/40 ml-4">Email Address</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-silver/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/40 ml-4">Phone Number</label>
                  <input
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-silver/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/40 ml-4">Shipping Address</label>
                  <textarea
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your full street address"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-silver/50 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/40 ml-4">City</label>
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter your city"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-silver/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/40 ml-4">Order Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions for delivery?"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-silver/50 transition-all resize-none"
                  />
                </div>

                <div className="pt-6">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-silver/20 rounded-full flex items-center justify-center text-silver">
                      <CreditCard size={20} />
                    </div>
                    <h2 className="text-2xl font-serif">Payment Method</h2>
                  </div>
                  <div className="glass p-6 rounded-2xl border border-silver/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full bg-silver ring-4 ring-silver/20" />
                      <div>
                        <p className="font-bold">Cash on Delivery</p>
                        <p className="text-xs text-white/40 uppercase tracking-widest">Pay when you receive your order</p>
                      </div>
                    </div>
                    <Truck size={24} className="text-white/20" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-silver hover:text-black transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-12 shadow-2xl shadow-white/5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      Submit Order
                      <ShoppingBag size={20} />
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          {/* Summary */}
          <div className="lg:col-span-5">
            <div className="glass rounded-[2.5rem] p-8 md:p-12 sticky top-32">
              <h2 className="text-2xl font-serif mb-8">Order Summary</h2>
              
              <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden glass flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                      <h4 className="font-serif leading-tight mb-1">{item.name}</h4>
                      <div className="flex justify-between items-center">
                        <p className="text-white/40 text-sm">{item.quantity} × {item.price.toLocaleString()} EGP</p>
                        <p className="font-bold">{(item.price * item.quantity).toLocaleString()} EGP</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <div className="mb-8 pt-6 border-t border-white/10">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Discount code" 
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-silver/50 transition-all uppercase"
                    />
                  </div>
                  <button 
                    onClick={handleApplyDiscount}
                    disabled={isCheckingDiscount || !discountCode}
                    className="px-6 py-3 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    {isCheckingDiscount ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {appliedDiscount && (
                  <div className="mt-3 flex items-center justify-between bg-silver/20 border border-silver/30 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-silver" />
                      <span className="text-xs font-bold text-silver">{appliedDiscount.code}</span>
                    </div>
                    <button onClick={() => setAppliedDiscount(null)} className="text-white/40 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-white/60">
                  <span className="font-light uppercase tracking-widest text-xs">Subtotal</span>
                  <span>{totalPrice.toLocaleString()} EGP</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-green-400">
                    <span className="font-light uppercase tracking-widest text-xs">Discount</span>
                    <span>-{discountAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                {settings.taxRate > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span className="font-light uppercase tracking-widest text-xs">Estimated Tax ({settings.taxRate}%)</span>
                    <span>{taxAmount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div className="flex justify-between text-white/60">
                  <span className="font-light uppercase tracking-widest text-xs">Shipping</span>
                  <span>{settings.shippingFee === 0 ? "FREE" : `${settings.shippingFee.toLocaleString()} EGP`}</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="font-serif text-xl">Total Amount</span>
                  <span className="text-3xl font-serif text-glow">{finalTotal.toLocaleString()} EGP</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-silver/10 rounded-2xl border border-silver/20">
                <p className="text-[10px] text-silver uppercase tracking-[0.2em] font-bold text-center">
                  Luxury Packaging Included
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

