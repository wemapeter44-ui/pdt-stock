import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Plus, Search, Package, Loader2, X, ArrowUpDown, Pencil, Trash2, Archive } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Toast from '../../components/ui/Toast'

export default function Products() {
  const { business } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', buying_price: '', selling_price: '', quantity: '', min_stock_level: '5'
  })
  const [formError, setFormError] = useState('')

  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [stockFormData, setStockFormData] = useState({ type: 'purchase', quantity_change: '', reason: '' })
  const [stockSubmitting, setStockSubmitting] = useState(false)
  const [stockError, setStockError] = useState('')

  // Custom UI States
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (business?.id) fetchProducts()
  }, [business])

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products').select('*').eq('business_id', business.id).eq('is_archived', false).order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({ name: '', sku: '', description: '', buying_price: '', selling_price: '', quantity: '', min_stock_level: '5' })
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name, sku: product.sku || '', description: product.description || '',
      buying_price: product.buying_price, selling_price: product.selling_price,
      quantity: product.quantity, min_stock_level: product.min_stock_level
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      if (Number(formData.selling_price) < Number(formData.buying_price)) throw new Error('Selling price cannot be less than buying price.')
      
      if (editingProduct) {
        const { error } = await supabase.from('products').update({
          name: formData.name, sku: formData.sku || null, description: formData.description || null,
          buying_price: Number(formData.buying_price), selling_price: Number(formData.selling_price),
          min_stock_level: Number(formData.min_stock_level) || 5,
        }).eq('id', editingProduct.id)
        if (error) throw error
        setToast({ type: 'success', message: 'Product updated!' })
      } else {
        const { error } = await supabase.from('products').insert([{
          business_id: business.id, name: formData.name, sku: formData.sku || null,
          description: formData.description || null, buying_price: Number(formData.buying_price),
          selling_price: Number(formData.selling_price), quantity: Number(formData.quantity) || 0,
          min_stock_level: Number(formData.min_stock_level) || 5,
        }])
        if (error) throw error
        setToast({ type: 'success', message: 'Product added!' })
      }

      setIsModalOpen(false)
      fetchProducts()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    try {
      const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', archiveTarget.id)
      if (error) throw error
      setToast({ type: 'success', message: `${archiveTarget.name} archived` })
      setArchiveTarget(null)
      fetchProducts()
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
  }

  const openStockModal = (product) => {
    setSelectedProduct(product)
    setStockFormData({ type: 'purchase', quantity_change: '', reason: '' })
    setStockError('')
    setIsStockModalOpen(true)
  }

  const handleStockSubmit = async (e) => {
    e.preventDefault()
    setStockError('')
    setStockSubmitting(true)
    try {
      const qtyChange = Number(stockFormData.quantity_change)
      if (qtyChange === 0) throw new Error('Quantity cannot be zero.')
      if (stockFormData.type === 'purchase' && qtyChange < 0) throw new Error('Purchases must be positive.')

      const { error } = await supabase.rpc('adjust_stock', {
        p_product_id: selectedProduct.id, p_quantity_change: qtyChange,
        p_type: stockFormData.type, p_reason: stockFormData.reason || null
      })
      if (error) throw error
      setToast({ type: 'success', message: 'Stock adjusted!' })
      setIsStockModalOpen(false)
      fetchProducts()
    } catch (error) {
      setStockError(error.message)
    } finally {
      setStockSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Products</h1>
          <p className="text-slate-400">Manage your inventory and pricing</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/products/archived')} className="btn-secondary">
            <Archive className="w-4 h-4" /> View Archived
          </button>
          <button onClick={openAddModal} className="btn-primary">
            <Plus className="w-5 h-5" /> Add Product
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input type="text" placeholder="Search products or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-4" /> Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No products found</h3>
            <p className="text-slate-400 mb-6">{search ? "No products match your search." : "Get started by adding your first product."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-navy-900/50 border-b border-navy-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product Name</th>
                  <th className="px-6 py-4 font-semibold">SKU</th>
                  <th className="px-6 py-4 font-semibold">Selling Price</th>
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-navy-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                    <td className="px-6 py-4 text-slate-400">{product.sku || '-'}</td>
                    <td className="px-6 py-4 font-medium text-cyan-400">KES {Number(product.selling_price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.quantity <= product.min_stock_level ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-success/10 text-success border border-success/20'
                      }`}>
                        {product.quantity} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => openStockModal(product)} className="btn-secondary py-1.5 px-3 text-xs" title="Adjust Stock"><ArrowUpDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEditModal(product)} className="btn-secondary py-1.5 px-3 text-xs" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setArchiveTarget(product)} className="btn-secondary py-1.5 px-3 text-xs text-danger hover:bg-danger/10" title="Archive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ARCHIVE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        title="Archive Product?"
        message={`"${archiveTarget?.name}" will be moved to Archived. You can restore it anytime. Past sales history will remain intact.`}
        confirmText="Archive"
        type="danger"
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      {/* TOAST */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl bg-navy-900 border border-navy-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-navy-800">
              <h2 className="text-xl font-bold text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm">{formError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Product Name *</label><input type="text" name="name" required value={formData.name} onChange={handleChange} className="input" /></div>
                <div><label className="label">SKU / Code</label><input type="text" name="sku" value={formData.sku} onChange={handleChange} className="input" /></div>
              </div>
              <div><label className="label">Description</label><input type="text" name="description" value={formData.description} onChange={handleChange} className="input" /></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Buying Price (KES) *</label><input type="number" name="buying_price" required min="0" step="0.01" value={formData.buying_price} onChange={handleChange} className="input" /></div>
                <div><label className="label">Selling Price (KES) *</label><input type="number" name="selling_price" required min="0" step="0.01" value={formData.selling_price} onChange={handleChange} className="input" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingProduct && (
                  <div><label className="label">Opening Stock *</label><input type="number" name="quantity" required min="0" value={formData.quantity} onChange={handleChange} className="input" /></div>
                )}
                <div className={editingProduct ? 'md:col-span-2' : ''}>
                  <label className="label">Low Stock Alert Level</label>
                  <input type="number" name="min_stock_level" required min="0" value={formData.min_stock_level} onChange={handleChange} className="input" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-navy-800 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[120px]">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProduct ? 'Save Changes' : 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK MODAL */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-navy-900 border border-navy-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-navy-800">
              <h2 className="text-xl font-bold text-white">Adjust Stock</h2>
              <button onClick={() => setIsStockModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-slate-400">Product</p>
                <p className="font-medium text-white">{selectedProduct?.name}</p>
                <p className="text-xs text-cyan-400 mt-1">Current stock: {selectedProduct?.quantity}</p>
              </div>
              {stockError && <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm">{stockError}</div>}
              <div>
                <label className="label">Movement Type</label>
                <select name="type" value={stockFormData.type} onChange={(e) => setStockFormData({...stockFormData, type: e.target.value})} className="input">
                  <option value="purchase">Stock Purchase (Add)</option>
                  <option value="adjustment">Stock Adjustment</option>
                </select>
              </div>
              <div>
                <label className="label">Quantity Change *</label>
                <input type="number" required value={stockFormData.quantity_change} onChange={(e) => setStockFormData({...stockFormData, quantity_change: e.target.value})} className="input" placeholder={stockFormData.type === 'purchase' ? "e.g. 10" : "e.g. -2"} />
              </div>
              <div>
                <label className="label">Reason / Note</label>
                <input type="text" value={stockFormData.reason} onChange={(e) => setStockFormData({...stockFormData, reason: e.target.value})} className="input" placeholder="Optional..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-navy-800 mt-6">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={stockSubmitting} className="btn-primary min-w-[120px]">{stockSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}