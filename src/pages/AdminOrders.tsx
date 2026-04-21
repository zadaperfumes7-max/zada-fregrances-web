import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, getDoc, increment, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Loader2, ShoppingBag, User, Calendar, Tag, MoreVertical, CheckCircle2, ChevronDown, Search, X, Filter, Truck, CreditCard, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Order {
  id: string;
  userId: string;
  customerInfo: any;
  items: any[];
  total: number;
  subtotal?: number;
  discount?: { code: string | null, amount: number };
  tax?: number;
  shipping?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  fulfillmentStatus?: 'unfulfilled' | 'fulfilled' | 'partially_fulfilled';
  stockDecreased?: boolean;
  createdAt: any;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ 
        id: doc.id, 
        paymentStatus: 'pending',
        fulfillmentStatus: 'unfulfilled',
        ...doc.data() 
      })) as Order[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "orders");
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.data() as Order;

      const updates: any = { status: newStatus };

      if (newStatus === 'delivered') {
        updates.paymentStatus = 'paid';
        updates.fulfillmentStatus = 'fulfilled';
        
        if (!orderData?.stockDecreased) {
          const items = orderData?.items || [];
          for (const item of items) {
            const productId = item.productId || item.id;
            if (productId) {
              const productRef = doc(db, "products", productId);
              await updateDoc(productRef, {
                stock: increment(-item.quantity)
              });
            }
          }
          updates.stockDecreased = true;
        }
      }

      await updateDoc(orderRef, updates);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleBulkStatus = async (status: Order['status']) => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, "orders", id), { status });
      });
      await batch.commit();
      toast.success(`Updated ${selectedIds.length} orders to ${status}`);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Bulk update failed");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'processing': return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
      case 'shipped': return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
      case 'delivered': return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'cancelled': return 'bg-red-400/10 text-red-400 border-red-400/20';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'pending': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
      case 'refunded': return 'bg-white/10 text-white/60 border-white/10';
      default: return 'bg-white/5 text-white/40 border-white/10';
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerInfo?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-serif mb-2">Orders</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">Track and manage customer luxury orders.</p>
        </div>
      </div>

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden mb-12">
        {/* Bulk Action Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-silver/10 border-b border-white/5 px-8 py-4 flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold text-silver uppercase tracking-widest">{selectedIds.length} selected</span>
                <div className="h-4 w-px bg-white/10" />
                <button 
                  onClick={() => handleBulkStatus('processing')}
                  className="text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Mark as Processing
                </button>
                <button 
                  onClick={() => handleBulkStatus('shipped')}
                  className="text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Mark as Shipped
                </button>
                <button 
                  onClick={() => handleBulkStatus('cancelled')}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                >
                  Cancel Orders
                </button>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[10px] font-bold text-white/20 hover:text-white uppercase tracking-widest transition-colors"
              >
                Deselect all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-grow bg-white/5 rounded-2xl px-6 py-3 flex items-center gap-4 w-full group focus-within:border-silver/50 border border-transparent transition-all">
            <Search size={18} className="text-white/20 group-focus-within:text-silver transition-colors" />
            <input 
              type="text" 
              placeholder="Filter orders by ID or customer..." 
              className="bg-transparent w-full focus:outline-none text-sm text-white placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Filter size={16} className="text-white/20" />
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 focus:outline-none focus:border-silver/50 appearance-none cursor-pointer pr-10"
              >
                <option value="all" className="bg-black">All Status</option>
                <option value="pending" className="bg-black">Pending</option>
                <option value="processing" className="bg-black">Processing</option>
                <option value="shipped" className="bg-black">Shipped</option>
                <option value="delivered" className="bg-black">Delivered</option>
                <option value="cancelled" className="bg-black">Cancelled</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-white/10 bg-white/5 text-silver focus:ring-silver/50"
                    checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Order</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Customer</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Total</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Payment</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Fulfillment</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-white/[0.03] transition-colors group ${selectedIds.includes(order.id) ? 'bg-silver/5' : ''}`}>
                  <td className="px-8 py-6">
                    <input 
                      type="checkbox" 
                      className="rounded border-white/10 bg-white/5 text-silver focus:ring-silver/50"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-bold text-sm text-white">#{order.id.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {order.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-medium text-white">{order.customerInfo?.fullName}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{order.customerInfo?.city}</p>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-white">
                    {order.total?.toLocaleString()} EGP
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                        : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                    }`}>
                      {order.paymentStatus || 'pending'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                      order.fulfillmentStatus === 'fulfilled' 
                        ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                        : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                    }`}>
                      {order.fulfillmentStatus || 'unfulfilled'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="relative inline-block text-left">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className={`appearance-none border rounded-xl pl-4 pr-10 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-silver/50 transition-all cursor-pointer ${
                          order.status === 'delivered' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                          order.status === 'cancelled' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                          'bg-white/5 text-white/60 border-white/10'
                        }`}
                      >
                        <option value="pending" className="bg-black">Pending</option>
                        <option value="processing" className="bg-black">Processing</option>
                        <option value="shipped" className="bg-black">Shipped</option>
                        <option value="delivered" className="bg-black">Delivered</option>
                        <option value="cancelled" className="bg-black">Cancelled</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="p-24 text-center text-white/20 text-sm italic uppercase tracking-widest">
              No orders found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Detailed Order View (List) */}
      <div className="space-y-10">
        <h2 className="text-2xl font-serif text-white">Recent Order Details</h2>
        {filteredOrders.slice(0, 5).map((order) => (
          <div key={order.id} className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="px-8 py-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-silver/20 rounded-xl flex items-center justify-center text-silver">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <span className="font-bold text-sm text-white">Order #{order.id.slice(-6).toUpperCase()}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                      order.status === 'delivered' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                      order.status === 'cancelled' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                      'bg-white/10 text-white/40 border-white/10'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-[10px] text-white/20 uppercase tracking-widest">
                      {order.createdAt?.toDate().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-white">
                  <User size={18} className="text-silver" />
                  <span className="text-sm font-bold uppercase tracking-widest">Customer</span>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-serif text-white">{order.customerInfo?.fullName}</p>
                  <p className="text-sm text-white/40">{order.customerInfo?.email}</p>
                  <p className="text-sm text-white/40">{order.customerInfo?.phone}</p>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-white mb-4">
                    <Truck size={18} className="text-silver" />
                    <span className="text-sm font-bold uppercase tracking-widest">Shipping</span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {order.customerInfo?.address}<br />
                    {order.customerInfo?.city}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-white">
                  <Package size={18} className="text-silver" />
                  <span className="text-sm font-bold uppercase tracking-widest">Items</span>
                </div>
                <div className="space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-silver/30 transition-all">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-serif text-white truncate">{item.name}</p>
                        {item.sizeLabel && (
                          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                            Size: {item.sizeLabel}
                          </p>
                        )}
                        <p className="text-[10px] text-silver font-bold uppercase tracking-widest">{item.quantity} × {item.price.toLocaleString()} EGP</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 text-white">
                  <CreditCard size={18} className="text-silver" />
                  <span className="text-sm font-bold uppercase tracking-widest">Payment Summary</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-white/40">
                    <span className="uppercase tracking-widest text-[10px] font-bold">Subtotal</span>
                    <span className="font-medium">{order.subtotal?.toLocaleString() || order.total?.toLocaleString()} EGP</span>
                  </div>
                  {order.discount && order.discount.amount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="uppercase tracking-widest text-[10px] font-bold">Discount ({order.discount.code})</span>
                      <span className="font-medium">-{order.discount.amount.toLocaleString()} EGP</span>
                    </div>
                  )}
                  {order.tax && order.tax > 0 && (
                    <div className="flex justify-between text-white/40">
                      <span className="uppercase tracking-widest text-[10px] font-bold">Tax</span>
                      <span className="font-medium">{order.tax.toLocaleString()} EGP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/40">
                    <span className="uppercase tracking-widest text-[10px] font-bold">Shipping</span>
                    <span className="font-medium">{order.shipping === 0 ? 'FREE' : `${order.shipping?.toLocaleString()} EGP`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-4 border-t border-white/10">
                    <span className="uppercase tracking-widest text-xs">Total</span>
                    <span className="text-lg font-serif">{order.total?.toLocaleString()} EGP</span>
                  </div>
                </div>
                <div className={`mt-6 p-4 rounded-2xl border flex items-center gap-4 ${
                  order.paymentStatus === 'paid' 
                    ? 'bg-green-400/10 border-green-400/20 text-green-400' 
                    : 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400'
                }`}>
                  {order.paymentStatus === 'paid' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    {order.paymentStatus === 'paid' ? 'Payment Received' : 'Payment Pending (COD)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

