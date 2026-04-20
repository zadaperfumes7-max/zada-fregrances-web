import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Loader2, Plus, Trash2, Tag, Check, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    type: 'percentage',
    value: 0,
    active: true,
    expiryDate: ''
  });

  useEffect(() => {
    const q = query(collection(db, "discounts"), orderBy("code", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setDiscounts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "discounts");
    });

    return () => unsubscribe();
  }, []);

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscount.code || newDiscount.value <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await addDoc(collection(db, "discounts"), {
        ...newDiscount,
        code: newDiscount.code.toUpperCase(),
        createdAt: new Date()
      });
      toast.success("Discount code created");
      setShowAddModal(false);
      setNewDiscount({ code: '', type: 'percentage', value: 0, active: true, expiryDate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "discounts");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "discounts", id), { active: !currentStatus });
      toast.success("Status updated");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "discounts");
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount code?")) return;
    try {
      await deleteDoc(doc(db, "discounts", id));
      toast.success("Discount code deleted");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "discounts");
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
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-serif mb-2 text-white">Discounts</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">Create and manage promotional discount codes.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-silver transition-all shadow-xl shadow-white/5"
        >
          <Plus size={18} />
          Create discount
        </button>
      </div>

      <div className="glass-dark rounded-[2.5rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Discount Code</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Type</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Value</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Status</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Expiry</th>
              <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-white/20 italic text-sm uppercase tracking-widest">
                  No discount codes found.
                </td>
              </tr>
            ) : (
              discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-silver/40 group-hover:text-silver transition-colors border border-white/5">
                        <Tag size={16} />
                      </div>
                      <span className="font-bold text-base text-white">{discount.code}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-white/40 group-hover:text-white/60 transition-colors capitalize">{discount.type}</td>
                  <td className="px-8 py-6 text-base font-bold text-white">
                    {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} EGP`}
                  </td>
                  <td className="px-8 py-6">
                    <button
                      onClick={() => toggleStatus(discount.id, discount.active)}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                        discount.active 
                        ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                        : 'bg-red-400/10 text-red-400 border-red-400/20'
                      }`}
                    >
                      {discount.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-sm text-white/40">
                    {discount.expiryDate ? new Date(discount.expiryDate).toLocaleDateString() : (
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/20">No expiry</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => deleteDiscount(discount.id)}
                      className="text-white/20 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Discount Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-dark rounded-[3rem] shadow-2xl p-10 md:p-12 border border-white/10"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-serif text-white">Create discount</h2>
                  <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Configure a new promotional code.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-white/20 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddDiscount} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Discount Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE20"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white uppercase"
                    value={newDiscount.code}
                    onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Type</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white appearance-none cursor-pointer"
                      value={newDiscount.type}
                      onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}
                    >
                      <option value="percentage" className="bg-black">Percentage</option>
                      <option value="fixed" className="bg-black">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Value</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 20"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                      value={newDiscount.value}
                      onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white appearance-none cursor-pointer"
                    value={newDiscount.expiryDate}
                    onChange={(e) => setNewDiscount({ ...newDiscount, expiryDate: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2 px-4 py-3 glass rounded-2xl border border-white/5">
                  <input
                    type="checkbox"
                    id="active"
                    checked={newDiscount.active}
                    onChange={(e) => setNewDiscount({ ...newDiscount, active: e.target.checked })}
                    className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-silver focus:ring-silver/50"
                  />
                  <label htmlFor="active" className="text-xs font-bold text-white/60 uppercase tracking-widest cursor-pointer">Set as active immediately</label>
                </div>

                <div className="pt-8 flex gap-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 glass rounded-2xl font-bold text-[10px] text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-silver transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                  >
                    Create Code
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
