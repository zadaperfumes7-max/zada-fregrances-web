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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#202223]">Customers</h1>
        <p className="text-[#5c5f62] text-sm">Manage your luxury clientele and their profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.length === 0 ? (
          <div className="col-span-full bg-white p-20 text-center rounded-xl border border-[#d2d5d9] shadow-sm">
            <Users size={48} className="mx-auto mb-4 text-[#d2d5d9]" />
            <h2 className="text-lg font-bold text-[#202223] mb-1">No customers found</h2>
            <p className="text-[#5c5f62] text-sm italic">When users sign up, they will appear here.</p>
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl p-6 border border-[#d2d5d9] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#f6f6f7] flex-shrink-0 border border-[#d2d5d9] group-hover:border-slate-400 transition-all">
                  {customer.photoURL ? (
                    <img src={customer.photoURL} alt={customer.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#d2d5d9]">
                      <User size={24} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#202223] truncate">{customer.displayName || 'Anonymous'}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <Shield size={10} />
                    {customer.role || 'customer'}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#d2d5d9]">
                <div className="flex items-center gap-3 text-xs text-[#5c5f62]">
                  <Mail size={14} className="text-[#d2d5d9]" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#5c5f62]">
                  <Calendar size={14} className="text-[#d2d5d9]" />
                  <span>Joined {customer.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#5c5f62]">
                  <ShoppingBag size={14} className="text-[#d2d5d9]" />
                  <span className="truncate">UID: {customer.uid?.slice(0, 12)}...</span>
                </div>
              </div>

              <button
                onClick={() => fetchCustomerOrders(customer)}
                className="w-full mt-6 py-2 bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg font-bold text-xs text-[#202223] hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} />
                Order History
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
              className="absolute inset-0 bg-[#202223]/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 overflow-hidden flex flex-col max-h-[90vh] border border-[#d2d5d9]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-[#202223]">Order History</h2>
                  <p className="text-sm text-[#5c5f62]">Client: <span className="text-[#202223] font-bold">{selectedCustomer.displayName}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[#5c5f62] hover:text-[#202223] p-1 hover:bg-[#f1f1f1] rounded-md transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {loadingOrders ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="py-20 text-center">
                    <ShoppingBag size={48} className="mx-auto mb-4 text-[#d2d5d9]" />
                    <p className="text-[#5c5f62] italic text-sm">This customer hasn't placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-5 border border-[#d2d5d9] hover:shadow-sm transition-all group">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#f6f6f7] rounded-lg flex items-center justify-center text-slate-800 border border-[#d2d5d9] font-bold text-[10px]">
                              #ORD
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#202223]">Order #{order.id.slice(-8).toUpperCase()}</p>
                              <p className="text-xs text-[#5c5f62]">{order.createdAt?.toDate().toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-widest font-bold text-[#5c5f62] mb-0.5">Amount</p>
                              <p className="font-bold text-[#202223]">{order.total?.toLocaleString()} EGP</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[#d2d5d9] flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex-shrink-0 w-10 h-10 rounded-lg bg-white overflow-hidden border border-[#d2d5d9]">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" title={item.name} />
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
