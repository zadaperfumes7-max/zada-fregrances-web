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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#202223]">Settings</h1>
          <p className="text-[#5c5f62] text-sm">Configure your store's global parameters.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl border border-[#d2d5d9] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#f6f6f7] rounded-lg flex items-center justify-center text-slate-800 border border-[#d2d5d9]">
                <Globe size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#202223]">General Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Store Name</label>
                <input
                  type="text"
                  className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Contact Email</label>
                <input
                  type="email"
                  className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Shipping & Taxes */}
          <div className="bg-white rounded-xl border border-[#d2d5d9] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#f6f6f7] rounded-lg flex items-center justify-center text-slate-800 border border-[#d2d5d9]">
                <Truck size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#202223]">Shipping & Taxes</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Flat Shipping Fee (EGP)</label>
                <input
                  type="number"
                  className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                  value={settings.shippingFee}
                  onChange={(e) => setSettings({ ...settings, shippingFee: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Tax Rate (%)</label>
                <input
                  type="number"
                  className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Currency Settings */}
          <div className="bg-white rounded-xl border border-[#d2d5d9] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#f6f6f7] rounded-lg flex items-center justify-center text-slate-800 border border-[#d2d5d9]">
                <DollarSign size={20} />
              </div>
              <h2 className="text-lg font-bold text-[#202223]">Currency</h2>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#5c5f62] uppercase tracking-widest mb-1.5">Store Currency</label>
              <select
                className="w-full bg-[#f6f6f7] border border-[#d2d5d9] rounded-lg px-4 py-2 text-sm focus:ring-2 ring-slate-400 outline-none transition-all"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="EGP">Egyptian Pound (EGP)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
              <p className="mt-3 text-[10px] text-[#5c5f62] italic">This is the currency your customers will see and pay in.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
