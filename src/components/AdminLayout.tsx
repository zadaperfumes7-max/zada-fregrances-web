import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Home, 
  Settings as SettingsIcon, 
  Search,
  Bell,
  ChevronRight,
  Tag
} from 'lucide-react';
import { logout, auth } from '../firebase';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/admin' },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    { icon: Package, label: 'Products', path: '/admin/products' },
    { icon: Tag, label: 'Categories', path: '/admin/categories' },
    { icon: Users, label: 'Customers', path: '/admin/customers' },
    { icon: Tag, label: 'Discounts', path: '/admin/discounts' },
    { icon: SettingsIcon, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-black border-r border-white/10 flex flex-col fixed h-screen z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-silver rounded-xl flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-silver/20">Z</div>
          <span className="font-serif text-lg tracking-tight text-white">ZADA Admin</span>
        </div>
        
        <nav className="flex-grow px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${
                  isActive 
                  ? 'bg-silver text-black shadow-lg shadow-silver/10 font-bold' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-black' : 'text-white/40 group-hover:text-silver transition-colors'} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {isActive && <div className="w-1 h-4 bg-black/20 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all group"
          >
            <Home size={18} className="text-white/40 group-hover:text-silver transition-colors" />
            <span className="text-sm">Online Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {/* User profile at bottom */}
        <div className="p-4 bg-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-silver flex items-center justify-center text-black text-sm font-bold shadow-inner">
            {user?.displayName?.charAt(0) || 'A'}
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs font-bold truncate text-white">{user?.displayName || 'Admin'}</p>
            <p className="text-[10px] text-white/40 truncate uppercase tracking-widest">ZADA Fragrances</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow ml-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-black/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-grow max-w-xl">
            <div className="relative w-full">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Search analytics, orders..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-sm focus:outline-none focus:border-silver/50 transition-all text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-2 hover:bg-white/5 rounded-xl text-white/60 hover:text-white transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-silver rounded-full border-2 border-black" />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3 text-sm font-medium text-white/80">
              <span className="font-serif">ZADA Admin</span>
              <ChevronRight size={14} className="text-white/20" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
