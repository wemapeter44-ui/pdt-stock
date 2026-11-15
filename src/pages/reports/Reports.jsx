import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { 
  BarChart3, TrendingUp, Calendar, Loader2, DollarSign, Package 
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'

const COLORS = ['#22d3ee', '#6366f1', '#10b981', '#f59e0b', '#ef4444']

export default function Reports() {
  const { business } = useAuth()
  const [loading, setLoading] = useState(true)
  
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, totalStock: 0 })
  const [salesTrend, setSalesTrend] = useState([])
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    if (business?.id) fetchReportData()
  }, [business])

  async function fetchReportData() {
    try {
      setLoading(true)

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7); sevenDaysAgo.setHours(0, 0, 0, 0)

      // 1. Fetch Sales
      const { data: sales, error: salesError } = await supabase
        .from('sales').select('total, created_at').eq('business_id', business.id).gte('created_at', sevenDaysAgo.toISOString())
      if (salesError) throw salesError

      // 2. Fetch Sale Items
      const { data: items, error: itemsError } = await supabase
        .from('sale_items').select(`quantity, products (name), sales!inner (business_id, created_at)`)
        .eq('sales.business_id', business.id).gte('sales.created_at', startOfMonth.toISOString())
      if (itemsError) throw itemsError
      
      // 3. Fetch Total Stock Value (Ensuring we get buying_price as a number)
      const { data: products } = await supabase
        .from('products').select('quantity, buying_price').eq('business_id', business.id)
        
      const totalStock = products?.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.buying_price) || 0)), 0) || 0

      // --- Calculate Totals ---
      let todayTotal = 0, weekTotal = 0, monthTotal = 0
      sales?.forEach(sale => {
        const saleDate = new Date(sale.created_at)
        const amount = Number(sale.total) || 0
        if (saleDate >= startOfMonth) monthTotal += amount
        if (saleDate >= startOfWeek) weekTotal += amount
        if (saleDate >= startOfToday) todayTotal += amount
      })

      setStats({ today: todayTotal, week: weekTotal, month: monthTotal, totalStock })

      // --- Prepare Sales Trend Graph ---
      const trendData = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const dateStr = d.toLocaleDateString('en-KE', { weekday: 'short' })
        const dayTotal = sales?.filter(s => new Date(s.created_at).toDateString() === d.toDateString()).reduce((sum, s) => sum + Number(s.total), 0) || 0
        trendData.push({ name: dateStr, sales: dayTotal })
      }
      setSalesTrend(trendData)

      // --- Prepare Top Products Graph ---
      const productCounts = {}
      items?.forEach(item => {
        const name = item.products?.name || 'Unknown'
        if (!productCounts[name]) productCounts[name] = 0
        productCounts[name] += item.quantity
      })

      const sortedProducts = Object.entries(productCounts)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
      setTopProducts(sortedProducts)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
  }

  return (
    <div className="pb-10">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reports & Analytics</h1>
          <p className="text-slate-400">Business performance overview</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400 bg-navy-900 px-4 py-2 rounded-lg border border-navy-800">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 border-l-4 border-l-cyan-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Today's Revenue</p>
              <h3 className="text-2xl font-bold text-white">KES {stats.today.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-cyan-400/10 rounded-lg"><TrendingUp className="w-5 h-5 text-cyan-400" /></div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">This Week</p>
              <h3 className="text-2xl font-bold text-white">KES {stats.week.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg"><BarChart3 className="w-5 h-5 text-indigo-400" /></div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-l-success">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">This Month</p>
              <h3 className="text-2xl font-bold text-white">KES {stats.month.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-success/10 rounded-lg"><DollarSign className="w-5 h-5 text-success" /></div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-l-warning">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Stock Value</p>
              <h3 className="text-2xl font-bold text-white">KES {stats.totalStock.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-warning/10 rounded-lg"><Package className="w-5 h-5 text-warning" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-6">Sales Trend (Last 7 Days)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `K${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f1521', borderColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#22d3ee' }}
                  formatter={(value) => [`KES ${value.toLocaleString()}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NEW VERTICAL BAR CHART */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-6">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#1f2937'}}
                    contentStyle={{ backgroundColor: '#0f1521', borderColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`${value} units`, 'Sold']}
                  />
                  <Bar dataKey="qty" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}