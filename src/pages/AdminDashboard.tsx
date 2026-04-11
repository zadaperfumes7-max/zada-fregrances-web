import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Package, ShoppingCart, Users, TrendingUp, Loader2, DollarSign, ChevronRight, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Revenue', value: '0 EGP', icon: DollarSign, color: 'text-silver', path: '/admin', trend: '+12.5%', isUp: true },
    { label: 'Total Orders', value: '0', icon: ShoppingCart, color: 'text-silver', path: '/admin/orders', trend: '+5.2%', isUp: true },
    { label: 'Products', value: '0', icon: Package, color: 'text-silver', path: '/admin/products', trend: '0%', isUp: true },
    { label: 'Customers', value: '0', icon: Users, color: 'text-silver', path: '/admin/customers', trend: '+2.1%', isUp: true },
  ]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#C0C0C0', '#A9A9A9', '#808080', '#696969', '#404040'];

  useEffect(() => {
    // Real-time listeners for counts
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      const products = snap.docs.map(doc => doc.data());
      setStats(prev => prev.map(s => s.label === 'Products' ? { ...s, value: snap.size.toString() } : s));
      
      // Category distribution
      const categories: Record<string, number> = {};
      products.forEach(p => {
        categories[p.category] = (categories[p.category] || 0) + 1;
      });
      setCategoryData(Object.entries(categories).map(([name, value]) => ({ name, value })));
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setStats(prev => prev.map(s => s.label === 'Total Orders' ? { ...s, value: snap.size.toString() } : s));
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setRecentOrders(orders.slice(0, 5));
      
      const revenue = orders.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
      setStats(prev => prev.map(s => s.label === 'Total Revenue' ? { ...s, value: `${revenue.toLocaleString()} EGP` } : s));

      // Sales over time (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
      }).reverse();

      const salesByDay: Record<string, number> = {};
      orders.forEach((o: any) => {
        if (o.createdAt) {
          const day = o.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'short' });
          salesByDay[day] = (salesByDay[day] || 0) + o.total;
        }
      });

      setSalesData(last7Days.map(day => ({
        name: day,
        sales: salesByDay[day] || 0
      })));
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setStats(prev => prev.map(s => s.label === 'Customers' ? { ...s, value: snap.size.toString() } : s));
    });

    // Top Products
    const unsubTop = onSnapshot(query(collection(db, "products"), limit(5)), (snap) => {
      setTopProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
      unsubTop();
    };
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-silver" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-serif mb-2">Dashboard</h1>
          <p className="text-white/40 text-sm uppercase tracking-widest">Overview of your store's performance.</p>
        </div>
        <div className="flex items-center gap-2 glass px-4 py-2 rounded-full text-[10px] font-bold text-silver uppercase tracking-widest border border-silver/20">
          <Activity size={14} className="animate-pulse" />
          Live View
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={stat.path}
              className="glass p-6 rounded-[2rem] border border-white/5 hover:border-silver/30 transition-all group block relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{stat.label}</span>
                <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-silver/10 transition-colors">
                  <stat.icon size={20} className={stat.color} />
                </div>
              </div>
              <p className="text-3xl font-serif text-white mb-2">{stat.value}</p>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.isUp ? 'text-green-400' : 'text-red-400'}`}>
                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span className="uppercase tracking-widest">{stat.trend} from last month</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-serif">Sales Overview</h3>
            <select className="text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 rounded-full px-4 py-2 outline-none focus:border-silver/50 transition-all">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C0C0C0" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#C0C0C0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#C0C0C0' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#C0C0C0" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-xl font-serif mb-8">Category Distribution</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Total</p>
              <p className="text-2xl font-serif">{categoryData.reduce((a, b) => a + b.value, 0)}</p>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {categoryData.map((cat, index) => (
              <div key={cat.name} className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-white/60">{cat.name}</span>
                </div>
                <span className="text-white">{cat.value} items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-serif">Recent Orders</h3>
            <Link to="/admin/orders" className="text-[10px] font-bold text-silver uppercase tracking-widest hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-white/20 italic text-center py-12 text-sm uppercase tracking-widest">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-silver group-hover:bg-silver group-hover:text-black transition-all">
                      <ShoppingCart size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Order #{order.id.slice(0, 5).toUpperCase()}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{order.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-white">{order.total?.toLocaleString()} EGP</p>
                    <ChevronRight size={16} className="text-white/10 group-hover:text-silver transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-serif">Top Products</h3>
            <Link to="/admin/products" className="text-[10px] font-bold text-silver uppercase tracking-widest hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-white/20 italic text-center py-12 text-sm uppercase tracking-widest">No products added</p>
            ) : (
              topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden group-hover:border-silver/50 transition-all">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{product.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{product.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-silver">{product.price?.toLocaleString()} EGP</p>
                    <ChevronRight size={16} className="text-white/10 group-hover:text-silver transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

