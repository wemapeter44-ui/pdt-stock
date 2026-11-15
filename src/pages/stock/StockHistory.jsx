import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { History, Loader2, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react'

export default function StockHistory() {
  const { business } = useAuth()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!business?.id) return
    fetchMovements()

    // Listen for real-time changes
    const channel = supabase.channel('stock_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements', filter: `business_id=eq.${business.id}` }, () => {
        fetchMovements()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [business])

  async function fetchMovements() {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products (name),
          profiles:created_by (full_name)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(100) // Show last 100 movements

      if (error) throw error
      setMovements(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type, change) => {
    if (type === 'sale') return <ArrowDownRight className="w-5 h-5 text-danger" />
    if (type === 'purchase') return <ArrowUpRight className="w-5 h-5 text-success" />
    return <RefreshCw className="w-5 h-5 text-warning" />
  }

  const getTypeBadge = (type) => {
    const colors = {
      sale: 'bg-danger/10 text-danger border-danger/20',
      purchase: 'bg-success/10 text-success border-success/20',
      adjustment: 'bg-warning/10 text-warning border-warning/20'
    }
    return colors[type] || 'bg-slate-700 text-slate-300'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Stock History</h1>
        <p className="text-slate-400">Track every inventory change across your business</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No stock movements yet</h3>
            <p className="text-slate-400">Movements will appear here when you add stock or make a sale.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-navy-900/50 border-b border-navy-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Change</th>
                  <th className="px-6 py-4 font-semibold">Note</th>
                  <th className="px-6 py-4 font-semibold">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-navy-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-white">{m.products?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getTypeBadge(m.type)}`}>
                        {getTypeIcon(m.type, m.quantity_change)}
                        {m.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${m.quantity_change > 0 ? 'text-success' : 'text-danger'}`}>
                      {m.quantity_change > 0 ? '+' : ''}{m.quantity_change}
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{m.reason || '-'}</td>
                    <td className="px-6 py-4 text-slate-400">{m.profiles?.full_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}