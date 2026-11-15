import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Search, Loader2, Receipt as ReceiptIcon, Eye } from 'lucide-react'

export default function SalesHistory() {
  const { business } = useAuth()
  const navigate = useNavigate()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!business?.id) return
    fetchSales()

    const channel = supabase.channel('sales_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales', filter: `business_id=eq.${business.id}` }, () => {
        fetchSales()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [business])

  async function fetchSales() {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`*, profiles:created_by (full_name)`)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(s => 
    s.total.toString().includes(search) || 
    new Date(s.created_at).toLocaleDateString().includes(search)
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Sales History</h1>
          <p className="text-slate-400">View all completed transactions</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Search by date or amount..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-4" /> Loading sales...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No sales found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-navy-900/50 border-b border-navy-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date & Time</th>
                  <th className="px-6 py-4 font-semibold">Cashier</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-navy-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{new Date(sale.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400">{sale.profiles?.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 font-bold text-cyan-400">KES {Number(sale.total).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">Completed</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/sales/receipt/${sale.id}`)}
                        className="btn-secondary py-1.5 px-3 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
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