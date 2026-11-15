import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Loader2, Printer, ArrowLeft } from 'lucide-react'

export default function Receipt() {
  const { id } = useParams()
  const { business } = useAuth()
  const navigate = useNavigate()
  
  const [sale, setSale] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && business?.id) fetchReceipt()
  }, [id, business])

  async function fetchReceipt() {
    try {
      setLoading(true)
      
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`*, profiles:created_by (full_name)`)
        .eq('id', id)
        .eq('business_id', business.id)
        .single()

      if (saleError) throw saleError
      setSale(saleData)

      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`*, products (name)`)
        .eq('sale_id', id)

      if (itemsError) throw itemsError
      setItems(itemsData || [])

    } catch (error) {
      console.error('Error fetching receipt:', error.message)
      navigate('/sales/history')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
  }

  if (!sale) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => navigate('/sales/history')} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Back to Sales
        </button>
        <button onClick={handlePrint} className="btn-primary">
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>

      <div className="bg-white text-black p-8 rounded-xl shadow-2xl print:shadow-none print:p-0 print:rounded-none">
        
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-6 mb-6">
          {business?.logo_url && (
            <img src={business.logo_url} alt={business.name} className="w-20 h-20 object-contain mx-auto mb-3" />
          )}
          <h1 className="text-3xl font-extrabold uppercase tracking-wider mb-2">{business?.name}</h1>
          {business?.address && <p className="text-gray-700 text-sm">{business.address}</p>}
          {business?.phone && <p className="text-gray-700 text-sm">Tel: {business.phone}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="font-bold text-gray-900 uppercase text-xs">Receipt No</p>
            <p className="font-mono text-base">{sale.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 uppercase text-xs">Date & Time</p>
            <p>{new Date(sale.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="text-sm mb-6 pb-4 border-b border-gray-300">
          <p className="font-bold text-gray-900 uppercase text-xs">Served By</p>
          <p className="capitalize">{sale.profiles?.full_name || 'Unknown Cashier'}</p>
        </div>

        <table className="w-full text-left text-sm mb-6">
          <thead className="border-b-2 border-gray-800">
            <tr>
              <th className="py-2 font-bold text-gray-900">Item</th>
              <th className="py-2 font-bold text-gray-900 text-center">Qty</th>
              <th className="py-2 font-bold text-gray-900 text-right">Price</th>
              <th className="py-2 font-bold text-gray-900 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">{item.products?.name || 'Unknown Product'}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{Number(item.unit_price).toLocaleString()}</td>
                <td className="py-3 text-right">{Number(item.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-gray-800 pt-4 mb-8">
          <div className="flex justify-between items-center text-xl font-extrabold">
            <span className="uppercase">Total Paid:</span>
            <span>KES {Number(sale.total).toLocaleString()}</span>
          </div>
          <p className="text-right text-xs text-gray-600 mt-2 uppercase font-semibold">Payment: {sale.payment_method || 'Cash'}</p>
        </div>

        <div className="text-center text-sm text-gray-600 mt-8 pt-6 border-t border-dashed border-gray-300">
          <p className="font-bold text-gray-900 mb-1">THANK YOU FOR YOUR BUSINESS!</p>
          <p>Goods sold are not returnable after 24 hours</p>
          <p className="text-xs mt-3 font-semibold">Powered by PDT Softwares</p>
        </div>

      </div>
    </div>
  )
}