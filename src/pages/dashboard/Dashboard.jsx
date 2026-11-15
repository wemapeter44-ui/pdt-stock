import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  Package, ShoppingCart, DollarSign, AlertTriangle, Loader2, 
  Plus, Receipt, BarChart3, ArrowRight 
} from 'lucide-react'

export default function Dashboard() {
  const { profile, business } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({ totalProducts: 0, todaysSales: 0, stockValue: 0, lowStockCount: 0 })
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    fetchDashboardData()

    const channel = supabase.channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `business_id=eq.${business.id}` }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `business_id=eq.${business.id}` }, () => fetchDashboardData())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [business])

  async function fetchDashboardData() {
    try {
      const { data: products } = await supabase.from('products').select('*').eq('business_id', business.id).eq('is_archived', false)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const { data: salesToday } = await supabase.from('sales').select('total').eq('business_id', business.id).gte('created_at', today.toISOString())
      const { data: recent } = await supabase.from('sales').select(`id, total, created_at, profiles:created_by (full_name)`).eq('business_id', business.id).order('created_at', { ascending: false }).limit(5)

      const totalProducts = products?.length || 0
      const stockValue = products?.reduce((sum, p) => sum + (Number(p.buying_price) * p.quantity), 0) || 0
      const todaysSales = salesToday?.reduce((sum, s) => sum + Number(s.total), 0) || 0
      const lowStockCount = products?.filter(p => p.quantity <= p.min_stock_level).length || 0

      setStats({ totalProducts, todaysSales, stockValue, lowStockCount })
      setRecentSales(recent || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'User'} 👋
        </h2>
        <p className="text-slate-400">
          Here's what's happening at <span className="text-brand-400 font-medium">{business?.name}</span> today.
        </p>
      </div>

      {/* KPI Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="card p-5 md:p-6 border-l-4 border-l-brand-400 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-brand-400/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Products</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">{stats.totalProducts}</h3>
            </div>
            <div className="p-2.5 bg-brand-400/10 rounded-xl"><Package className="w-5 h-5 md:w-6 md:h-6 text-brand-400" /></div>
          </div>
        </div>
        
        <div className="card p-5 md:p-6 border-l-4 border-l-brand-500 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-brand-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Today's Sales</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">KES {stats.todaysSales.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 bg-brand-500/10 rounded-xl"><ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-brand-500" /></div>
          </div>
        </div>

        <div className="card p-5 md:p-6 border-l-4 border-l-success relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-success/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Stock Value</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">KES {stats.stockValue.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 bg-success/10 rounded-xl"><DollarSign className="w-5 h-5 md:w-6 md:h-6 text-success" /></div>
          </div>
        </div>

        <div className="card p-5 md:p-6 border-l-4 border-l-danger relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-danger/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Low Stock</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white">{stats.lowStockCount}</h3>
            </div>
            <div className="p-2.5 bg-danger/10 rounded-xl"><AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-danger" /></div>
          </div>
        </div>
      </div>

      {/* Quick Actions - 2 cols on mobile, 4 on desktop */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <button onClick={() => navigate('/sales/new')} className="card p-4 md:p-5 text-left hover:border-brand-400/50 transition-colors group">
            <div className="p-2 bg-brand-400/10 rounded-lg w-fit mb-3 group-hover:bg-brand-400/20 transition-colors">
              <Plus className="w-4 h-4 md:w-5 md:h-5 text-brand-400" />
            </div>
            <p className="font-bold text-white text-sm md:text-base">New Sale</p>
            <p className="text-[10px] md:text-xs text-slate-400">Record transaction</p>
          </button>
          <button onClick={() => navigate('/products')} className="card p-4 md:p-5 text-left hover:border-brand-500/50 transition-colors group">
            <div className="p-2 bg-brand-500/10 rounded-lg w-fit mb-3 group-hover:bg-brand-500/20 transition-colors">
              <Package className="w-4 h-4 md:w-5 md:h-5 text-brand-500" />
            </div>
            <p className="font-bold text-white text-sm md:text-base">Add Product</p>
            <p className="text-[10px] md:text-xs text-slate-400">Add to inventory</p>
          </button>
          <button onClick={() => navigate('/sales/history')} className="card p-4 md:p-5 text-left hover:border-success/50 transition-colors group">
            <div className="p-2 bg-success/10 rounded-lg w-fit mb-3 group-hover:bg-success/20 transition-colors">
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-success" />
            </div>
            <p className="font-bold text-white text-sm md:text-base">Sales History</p>
            <p className="text-[10px] md:text-xs text-slate-400">View all sales</p>
          </button>
          <button onClick={() => navigate('/reports')} className="card p-4 md:p-5 text-left hover:border-warning/50 transition-colors group">
            <div className="p-2 bg-warning/10 rounded-lg w-fit mb-3 group-hover:bg-warning/20 transition-colors">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-warning" />
            </div>
            <p className="font-bold text-white text-sm md:text-base">View Reports</p>
            <p className="text-[10px] md:text-xs text-slate-400">Business insights</p>
          </button>
        </div>
      </div>

      {/* Recent Sales - Horizontal scroll on mobile */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">Recent Sales</h3>
          <button onClick={() => navigate('/sales/history')} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="card overflow-hidden">
          {recentSales.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No sales recorded yet. Click "New Sale" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 min-w-[500px]">
                <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 md:px-6 py-3 font-semibold">Date</th>
                    <th className="px-4 md:px-6 py-3 font-semibold">Cashier</th>
                    <th className="px-4 md:px-6 py-3 font-semibold">Amount</th>
                    <th className="px-4 md:px-6 py-3 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 md:px-6 py-4 text-slate-400">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="px-4 md:px-6 py-4">{sale.profiles?.full_name || 'Unknown'}</td>
                      <td className="px-4 md:px-6 py-4 font-bold text-brand-400">KES {Number(sale.total).toLocaleString()}</td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <button onClick={() => navigate(`/sales/receipt/${sale.id}`)} className="text-xs text-slate-400 hover:text-white font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}