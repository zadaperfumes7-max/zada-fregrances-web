import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Plus, Trash2, Loader2, Tag, X, Edit2, Check } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  createdAt: any;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(cats);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "categories");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSaving(true);
    try {
      const trimmedName = categoryName.trim();
      const isDuplicate = categories.some(cat => 
        cat.name.toLowerCase() === trimmedName.toLowerCase() && cat.id !== editingCategory?.id
      );

      if (isDuplicate) {
        toast.error("A category with this name already exists");
        setSaving(false);
        return;
      }

      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), {
          name: trimmedName
        });
        toast.success("Category updated");
      } else {
        await addDoc(collection(db, "categories"), {
          name: trimmedName,
          createdAt: serverTimestamp()
        });
        toast.success("Category added");
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingCategory ? OperationType.UPDATE : OperationType.CREATE, "categories");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will not delete products in this category, but they will no longer be filtered correctly.`)) return;
    
    try {
      await deleteDoc(doc(db, "categories", id));
      toast.success("Category deleted");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-serif mb-2">Categories</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">Organize your fragrance collection by scent profiles.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-silver hover:text-black transition-all shadow-xl shadow-white/5"
        >
          <Plus size={18} />
          Add category
        </button>
      </div>

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-24 flex justify-center">
              <Loader2 className="animate-spin text-silver" size={32} />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/20 border border-white/10">
                <Tag size={40} />
              </div>
              <p className="text-white/20 text-sm italic uppercase tracking-widest">No categories added yet.</p>
              <button 
                onClick={() => handleOpenModal()}
                className="mt-6 text-silver font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Create your first category
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Category Name</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Created At</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-silver border border-white/10 group-hover:border-silver/30 transition-all">
                          <Tag size={16} />
                        </div>
                        <span className="font-serif text-base text-white">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      {cat.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleOpenModal(cat)}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-silver"
                          title="Edit Category"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-2 hover:bg-red-400/10 rounded-xl transition-all text-white/40 hover:text-red-400"
                          title="Delete Category"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                  <h2 className="text-3xl font-serif text-white">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                  <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Define a new scent profile.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/20 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Category Name</label>
                  <input 
                    required
                    autoFocus
                    type="text" 
                    placeholder="e.g. Woody, Floral, Oriental"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving || !categoryName.trim()}
                    className="px-10 py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-silver hover:text-black transition-all shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {editingCategory ? 'Update' : 'Create'}
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
