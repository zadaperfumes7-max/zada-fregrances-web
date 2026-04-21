import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Plus, Search, Edit2, Trash2, MoreVertical, X, Loader2, Tag, Check, ChevronDown, Eye, EyeOff, DollarSign, Star } from 'lucide-react';
import { toast } from 'sonner';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface ProductSize {
  label: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string; // Cover image (first from images array)
  images?: string[]; // Multiple images
  stock: number;
  status: 'active' | 'draft';
  description?: string;
  sizes?: ProductSize[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!base64Str || !base64Str.startsWith('data:image')) {
        resolve(base64Str);
        return;
      }
      
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Luxury standard: Balanced resolution for Firestore limits
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }
        
        ctx.fillStyle = 'white'; 
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG is significantly smaller than PNG Base64 and is appropriate for luxury product shots
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = (error) => reject(error);
    });
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Form State
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    image: '',
    images: [] as string[],
    stock: '',
    description: '',
    status: 'active' as 'active' | 'draft',
    sizes: [] as { label: string; price: string }[]
  });

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        status: 'active', // Default if missing
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
      setLoading(false);
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    return () => {
      unsubscribe();
      unsubCats();
    };
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        image: product.image,
        images: product.images || [product.image].filter(Boolean),
        stock: product.stock.toString(),
        description: product.description || '',
        status: product.status || 'active',
        sizes: product.sizes?.map(s => ({ label: s.label, price: s.price.toString() })) || []
      });
    } else {
      setEditingProduct(null);
      setProductForm({ 
        name: '', 
        category: '', 
        price: '', 
        image: '', 
        images: [],
        stock: '', 
        description: '', 
        status: 'active',
        sizes: [] 
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.category) {
      toast.error("Please select a category");
      return;
    }
    
    setLoading(true);
    try {
      const parsedStock = parseInt(productForm.stock) || 0;
      const basePrice = parseFloat(productForm.price) || 0;

      const sizes = productForm.sizes.map(s => ({
        label: s.label,
        price: parseFloat(s.price) || 0
      })).filter(s => s.label && !isNaN(s.price));

      // If sizes exist, use the first size price as the default price
      const finalPrice = sizes.length > 0 ? sizes[0].price : basePrice;

      const data = {
        name: productForm.name.trim(),
        category: productForm.category,
        description: productForm.description.trim(),
        status: productForm.status,
        image: productForm.images[0] || '', // First image is cover
        images: productForm.images,
        price: finalPrice,
        stock: parsedStock,
        sizes: sizes,
        updatedAt: serverTimestamp()
      };

      if (!data.name) {
        toast.error("Product name is required");
        setLoading(false);
        return;
      }

      if (data.images.length === 0) {
        toast.error("At least one image is required");
        setLoading(false);
        return;
      }

      // Check final payload size (Firestore limit is 1MB)
      const approxSize = JSON.stringify(data).length;
      if (approxSize > 950000) {
        toast.error("Total product data (including images) is too large. Please use fewer or smaller images.");
        setLoading(false);
        return;
      }

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
        toast.success("Product updated successfully!");
      } else {
        await addDoc(collection(db, "products"), {
          ...data,
          rating: 5.0,
          createdAt: serverTimestamp()
        });
        toast.success("Product added successfully!");
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, "products");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success(`${name} deleted successfully`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} products?`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, "products", id));
      });
      await batch.commit();
      toast.success(`${selectedIds.length} products deleted`);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Bulk delete failed");
    }
  };

  const handleBulkStatus = async (status: 'active' | 'draft') => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, "products", id), { status });
      });
      await batch.commit();
      toast.success(`Updated ${selectedIds.length} products to ${status}`);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Bulk update failed");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = filterLowStock ? p.stock < 5 : true;
    return matchesSearch && matchesLowStock;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-serif mb-2">Products</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">Manage your fragrance collection and inventory.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-silver hover:text-black transition-all shadow-xl shadow-white/5"
        >
          <Plus size={18} />
          Add product
        </button>
      </div>

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
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
                  onClick={() => handleBulkStatus('active')}
                  className="text-[10px] font-bold text-white/60 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <Eye size={14} className="text-silver" /> Set Active
                </button>
                <button 
                  onClick={() => handleBulkStatus('draft')}
                  className="text-[10px] font-bold text-white/60 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <EyeOff size={14} className="text-silver" /> Set Draft
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-2 uppercase tracking-widest transition-colors"
                >
                  <Trash2 size={14} /> Delete
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
              placeholder="Filter products by name or category..." 
              className="bg-transparent w-full focus:outline-none text-sm text-white placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-white/20 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border shrink-0 ${
              filterLowStock 
                ? 'bg-red-400/10 border-red-400/30 text-red-400 shadow-lg shadow-red-400/5' 
                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${filterLowStock ? 'bg-red-400 animate-pulse' : 'bg-white/20'}`} />
            Low Stock
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-24 flex justify-center">
              <Loader2 className="animate-spin text-silver" size={32} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-24 text-center text-white/20 text-sm italic uppercase tracking-widest">
              No products found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-white/10 bg-white/5 text-silver focus:ring-silver/50"
                      checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Product</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Inventory</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Category</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-white/[0.03] transition-colors group ${selectedIds.includes(product.id) ? 'bg-silver/5' : ''}`}>
                    <td className="px-8 py-6">
                      <input 
                        type="checkbox" 
                        className="rounded border-white/10 bg-white/5 text-silver focus:ring-silver/50"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 group-hover:border-silver/30 transition-all">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-base text-white truncate">{product.name}</p>
                          <p className="text-[10px] text-silver font-bold uppercase tracking-widest">
                            {product.sizes && product.sizes.length > 0
                              ? `${Math.min(...product.sizes.map(s => s.price)).toLocaleString()} - ${Math.max(...product.sizes.map(s => s.price)).toLocaleString()} EGP (${product.sizes.length} sizes)`
                              : `${product.price.toLocaleString()} EGP`
                            }
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        product.status === 'active' 
                          ? 'bg-green-400/10 text-green-400 border-green-400/20' 
                          : 'bg-white/10 text-white/40 border-white/10'
                      }`}>
                        {product.status || 'active'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${product.stock < 5 ? 'text-red-400 font-bold' : 'text-white/80'}`}>
                          {product.stock} in stock
                        </span>
                        {product.stock < 5 && (
                          <span className="px-2 py-0.5 bg-red-400/20 text-red-400 text-[8px] font-bold uppercase tracking-widest rounded border border-red-400/30">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/40 border border-white/10">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-silver"
                          title="Edit Product"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-2 hover:bg-red-400/10 rounded-xl transition-all text-white/40 hover:text-red-400"
                          title="Delete Product"
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

      {/* Product Modal */}
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
              className="relative w-full max-w-4xl glass-dark rounded-[3rem] shadow-2xl p-10 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar border border-white/10"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-serif text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <p className="text-white/40 text-xs uppercase tracking-widest mt-1">Fill in the details for your fragrance.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/20 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveProduct} className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-7 space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Product Title</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Midnight Oud"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                        value={productForm.name}
                        onChange={e => setProductForm({...productForm, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Description</label>
                      <textarea 
                        rows={6}
                        placeholder="Describe the notes, the feeling, and the essence..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white resize-none"
                        value={productForm.description}
                        onChange={e => setProductForm({...productForm, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-4">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Product Gallery</label>
                        <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">{productForm.images.length} / 6 Images</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {productForm.images.map((img, index) => (
                          <motion.div 
                            key={index}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative aspect-square rounded-2xl overflow-hidden glass border border-white/10 group"
                          >
                            <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                              {index !== 0 && (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newImages = [...productForm.images];
                                    [newImages[index], newImages[0]] = [newImages[0], newImages[index]];
                                    setProductForm({...productForm, images: newImages});
                                  }}
                                  className="p-2 bg-white text-black rounded-lg hover:scale-110 transition-all"
                                  title="Set as Main Image"
                                >
                                  <Star size={14} className="fill-current" />
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={() => {
                                  const newImages = productForm.images.filter((_, i) => i !== index);
                                  setProductForm({...productForm, images: newImages});
                                }}
                                className="p-2 bg-red-400 text-white rounded-lg hover:scale-110 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            {index === 0 && (
                              <div className="absolute top-2 left-2 bg-silver text-black text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                                Cover
                              </div>
                            )}
                          </motion.div>
                        ))}
                        
                        {productForm.images.length < 6 && (
                          <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-silver/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/5 group">
                            <Plus size={20} className="text-white/20 group-hover:text-silver transition-all" />
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest group-hover:text-silver">Add Image</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    try {
                                      const base64 = reader.result as string;
                                      setLoading(true);
                                      const compressed = await compressImage(base64);
                                      setProductForm({
                                        ...productForm, 
                                        images: [...productForm.images, compressed]
                                      });
                                    } catch (err) {
                                      console.error("Compression error:", err);
                                      toast.error("Failed to process image");
                                    } finally {
                                      setLoading(false);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>

                      <div className="relative mt-4">
                        <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input 
                          type="url" 
                          placeholder="Or paste an image URL to add..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const url = (e.target as HTMLInputElement).value.trim();
                              if (url && productForm.images.length < 6) {
                                setProductForm({
                                  ...productForm,
                                  images: [...productForm.images, url]
                                });
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-8">
                    <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-silver/20 rounded-lg flex items-center justify-center text-silver">
                          <Eye size={16} />
                        </div>
                        <h3 className="text-lg font-serif">Visibility</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {['active', 'draft'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setProductForm({...productForm, status: status as any})}
                            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                              productForm.status === status
                                ? 'bg-silver text-black border-silver shadow-lg shadow-silver/10'
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-silver/20 rounded-lg flex items-center justify-center text-silver">
                          <Tag size={16} />
                        </div>
                        <h3 className="text-lg font-serif">Classification</h3>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Category</label>
                        <div className="relative">
                          <select 
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-silver/50 appearance-none cursor-pointer text-white"
                            value={productForm.category}
                            onChange={e => setProductForm({...productForm, category: e.target.value})}
                          >
                            <option value="" disabled className="bg-black">Select category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name} className="bg-black">{cat.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-silver/20 rounded-lg flex items-center justify-center text-silver">
                          <DollarSign size={16} />
                        </div>
                        <h3 className="text-lg font-serif">Value & Stock</h3>
                      </div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Base Price (EGP)</label>
                          <input 
                            required={productForm.sizes.length === 0}
                            type="number" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white disabled:opacity-50"
                            value={productForm.price}
                            onChange={e => setProductForm({...productForm, price: e.target.value})}
                            placeholder={productForm.sizes.length > 0 ? "Using size prices" : "e.g. 1500"}
                          />
                        </div>

                        {/* Sizes Section */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Product Sizes</label>
                            <button
                              type="button"
                              onClick={() => setProductForm({
                                ...productForm,
                                sizes: [...productForm.sizes, { label: '', price: '' }]
                              })}
                              className="text-[10px] font-bold text-silver hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
                            >
                              <Plus size={12} /> Add Size
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            {productForm.sizes.map((size, index) => (
                              <div key={index} className="flex gap-2 items-start">
                                <div className="flex-grow space-y-1">
                                  <input 
                                    required
                                    type="text"
                                    placeholder="Label (e.g. 50ml)"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-silver/50 text-white"
                                    value={size.label}
                                    onChange={e => {
                                      const newSizes = [...productForm.sizes];
                                      newSizes[index].label = e.target.value;
                                      setProductForm({ ...productForm, sizes: newSizes });
                                    }}
                                  />
                                </div>
                                <div className="w-24 space-y-1 text-right">
                                  <input 
                                    required
                                    type="number"
                                    placeholder="Price"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-silver/50 text-white"
                                    value={size.price}
                                    onChange={e => {
                                      const newSizes = [...productForm.sizes];
                                      newSizes[index].price = e.target.value;
                                      setProductForm({ ...productForm, sizes: newSizes });
                                    }}
                                  />
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newSizes = productForm.sizes.filter((_, i) => i !== index);
                                    setProductForm({ ...productForm, sizes: newSizes });
                                  }}
                                  className="p-2 text-white/20 hover:text-red-400 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            {productForm.sizes.length === 0 && (
                              <p className="text-[10px] text-white/20 italic ml-2">No sizes added. Single price will be used.</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-2">Inventory Level</label>
                          <input 
                            required
                            type="number" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                            value={productForm.stock}
                            onChange={e => setProductForm({...productForm, stock: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-10 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || !productForm.name.trim() || !productForm.category || productForm.images.length === 0}
                    className="px-10 py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-silver hover:text-black transition-all shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {editingProduct ? 'Update Fragrance' : 'Publish Fragrance'}
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

