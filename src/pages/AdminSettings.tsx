import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Loader2, Save, Globe, Truck, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    shippingFee: 50,
    taxRate: 14,
    currency: 'EGP',
    storeName: 'ZADA Fragrances',
    contactEmail: 'contact@zada.com'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...settings, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "settings");
    } finally {
      setSaving(false);
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
          <h1 className="text-4xl font-serif mb-2 text-white">Settings</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">Configure your store's global parameters.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-black px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-silver transition-all shadow-xl shadow-white/5 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* General Settings */}
          <div className="glass-dark rounded-[2.5rem] border border-white/5 p-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-silver border border-white/5">
                <Globe size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-serif text-white">General Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Store Name</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Contact Email</label>
                <input
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Shipping & Taxes */}
          <div className="glass-dark rounded-[2.5rem] border border-white/5 p-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-silver border border-white/5">
                <Truck size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-serif text-white">Shipping & Taxes</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Flat Shipping Fee (EGP)</label>
                <input
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                  value={settings.shippingFee}
                  onChange={(e) => setSettings({ ...settings, shippingFee: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Tax Rate (%)</label>
                <input
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {/* Currency Settings */}
          <div className="glass-dark rounded-[2.5rem] border border-white/5 p-10">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-silver border border-white/5">
                <DollarSign size={24} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-serif text-white">Currency</h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] ml-4">Store Currency</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white appearance-none cursor-pointer"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="EGP" className="bg-black">Egyptian Pound (EGP)</option>
                <option value="USD" className="bg-black">US Dollar (USD)</option>
                <option value="EUR" className="bg-black">Euro (EUR)</option>
              </select>
              <p className="mt-4 text-[10px] text-white/20 italic uppercase font-bold tracking-widest ml-4">This is the currency your customers will see and pay in.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
