import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Search, Loader2, Archive, RotateCcw, ArrowLeft } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Toast from '../../components/ui/Toast'

export default function ArchivedProducts() {
  const { business } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (business?.id) fetchArchivedProducts()
  }, [business])

  async function fetchArchivedProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products').select('*').eq('business_id', business.id).eq('is_archived', true).order('updated_at', { ascending: false })
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    try {
      const { error } = await supabase.from('products').update({ is_archived: false }).eq('id', restoreTarget.id)
      if (error) throw error
      setToast({ type: 'success', message: `${restoreTarget.name} restored!` })
      setRestoreTarget(null)
      fetchArchivedProducts()
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/products')} className="text-slate-400 hover:text-white mb-4 flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Archive className="w-6 h-6 text-warning" /> Archived Products
        </h1>
        <p className="text-slate-400">Deleted products that can still be restored</p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Search archived products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No archived products</h3>
            <p className="text-slate-400">Products you archive will show up here.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-navy-900/50 border-b border-navy-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold">Last Stock</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-navy-800/50">
                  <td className="px-6 py-4 font-medium text-slate-400 line-through">{product.name}</td>
                  <td className="px-6 py-4 text-slate-500">{product.sku || '-'}</td>
                  <td className="px-6 py-4 text-slate-500">{product.quantity} units</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setRestoreTarget(product)} className="btn-secondary py-1.5 px-3 text-xs text-success hover:bg-success/10 hover:border-success/30">
                      <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={!!restoreTarget}
        title="Restore Product?"
        message={`"${restoreTarget?.name}" will be restored to your active products list.`}
        confirmText="Restore"
        type="info"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}