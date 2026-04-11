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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#202223]">Discounts</h1>
          <p className="text-[#5c5f62] text-sm">Create and manage promotional discount codes.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-700 transition-all"
        >
          <Plus size={18} />
          Create discount
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#d2d5d9] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f6f6f7] border-b border-[#d2d5d9]">
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c5f62]">Discount Code</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c5f62]">Type</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c5f62]">Value</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c5f62]">Status</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c5f62]">Expiry</th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5c5f62] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d2d5d9]">
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#5c5f62] italic text-sm">
                  No discount codes found.
                </td>
              </tr>
            ) : (
              discounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-[#f9f9f9] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-slate-400" />
                      <span className="font-bold text-sm text-[#202223]">{discount.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5c5f62] capitalize">{discount.type}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#202223]">
                    {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} EGP`}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(discount.id, discount.active)}
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        discount.active 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {discount.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5c5f62]">
                    {discount.expiryDate ? new Date(discount.expiryDate).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteDiscount(discount.id)}
                      className="text-[#5c5f62] hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
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
              className="absolute inset-0 bg-[#202223]/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 border border-[#d2d5d9]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#202223]">Create discount code</h2>
                <button onClick={() => setShowAddModal(false)} className="text-[#5c5f62] hover:text-[#202223]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddDiscount} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Discount Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SAVE20"
                    className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all uppercase"
                    value={newDiscount.code}
                    onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Type</label>
                    <select
                      className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                      value={newDiscount.type}
                      onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Value</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                      value={newDiscount.value}
                      onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                    value={newDiscount.expiryDate}
                    onChange={(e) => setNewDiscount({ ...newDiscount, expiryDate: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={newDiscount.active}
                    onChange={(e) => setNewDiscount({ ...newDiscount, active: e.target.checked })}
                    className="w-4 h-4 rounded border-[#d2d5d9] text-slate-800 focus:ring-slate-400"
                  />
                  <label htmlFor="active" className="text-sm text-[#202223]">Set as active immediately</label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 border border-[#d2d5d9] rounded-lg font-bold text-sm text-[#202223] hover:bg-[#f6f6f7] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 transition-all"
                  >
                    Create discount
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
