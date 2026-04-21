import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Loader2, Users, User, Mail, Calendar, Shield, ShoppingBag, X, ExternalLink, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });

    return () => unsubscribe();
  }, []);

  const fetchCustomerOrders = async (customer: any) => {
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    try {
      const q = query(
        collection(db, "orders"), 
        where("userId", "==", customer.id),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setCustomerOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, "orders");
    } finally {
      setLoadingOrders(false);
    }
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-10">
        <h1 className="text-4xl font-serif mb-2 text-white">Customers</h1>
        <p className="text-white/40 text-sm uppercase tracking-widest">Manage your luxury clientele and their profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {customers.length === 0 ? (
          <div className="col-span-full glass-dark p-20 text-center rounded-[3.5rem] border border-white/5">
            <Users size={64} className="mx-auto mb-6 text-white/10" strokeWidth={1} />
            <h2 className="text-2xl font-serif text-white mb-2">No customers found</h2>
            <p className="text-white/40 text-sm uppercase tracking-widest italic">When users sign up, they will appear here.</p>
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="glass-dark rounded-[2.5rem] p-8 border border-white/5 group relative overflow-hidden transition-all duration-500 hover:border-silver/20 hover:translate-y-[-4px]">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl overflow-hidden glass flex-shrink-0 border border-white/5 group-hover:border-silver/30 transition-all duration-500">
                  {customer.photoURL ? (
                    <img src={customer.photoURL} alt={customer.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <User size={32} strokeWidth={1} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-serif text-white truncate group-hover:text-glow transition-all">{customer.displayName || 'Anonymous'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-silver/10 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest text-silver border border-silver/20 flex items-center gap-1">
                      <Shield size={10} />
                      {customer.role || 'customer'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs text-white/40 group-hover:text-white/60 transition-colors">
                  <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-silver/60">
                    <Mail size={14} />
                  </div>
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/40 group-hover:text-white/60 transition-colors">
                  <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-silver/60">
                    <Calendar size={14} />
                  </div>
                  <span>Joined {customer.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => fetchCustomerOrders(customer)}
                className="w-full mt-8 py-4 glass rounded-2xl font-bold text-xs text-white/60 uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 group/btn"
              >
                Order History
                <ExternalLink size={14} className="group-hover/btn:scale-110 transition-transform" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Order History Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl glass-dark rounded-[3rem] shadow-2xl p-10 md:p-12 overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-serif text-white">Order History</h2>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Client: <span className="text-silver font-bold">{selectedCustomer.displayName}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="text-white/20 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
                {loadingOrders ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-silver/40" size={32} />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="py-20 text-center opacity-40">
                    <ShoppingBag size={64} className="mx-auto mb-4 text-white" strokeWidth={1} />
                    <p className="text-white italic text-sm uppercase tracking-widest">This customer hasn't placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="glass rounded-[2rem] p-6 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-silver font-bold text-[10px] border border-white/5">
                              #ORD
                            </div>
                            <div>
                              <p className="font-serif text-lg text-white">Order #{order.id.slice(-8).toUpperCase()}</p>
                              <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{order.createdAt?.toDate().toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-white/20 mb-0.5">Amount</p>
                              <p className="font-bold text-white text-lg">{order.total?.toLocaleString()} EGP</p>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                              order.status === 'delivered' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                              order.status === 'cancelled' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                              'bg-white/5 text-white/60 border-white/10'
                            }`}>
                              {order.status}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-white/5 flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex-shrink-0 w-14 h-14 rounded-xl glass overflow-hidden border border-white/5 hover:border-silver/30 transition-all">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" title={item.name} referrerPolicy="no-referrer" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
