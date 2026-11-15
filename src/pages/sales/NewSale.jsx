import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Search, ShoppingCart, Trash2, Plus, Minus, Loader2 } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Toast from '../../components/ui/Toast'

export default function NewSale() {
  const { business, profile } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [cart, setCart] = useState([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  
  // Custom UI states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (business?.id) fetchProducts()
  }, [business])

  async function fetchProducts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products').select('*').eq('business_id', business.id).eq('is_archived', false).gt('quantity', 0).order('name')
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    setError('')
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.quantity) {
        setError(`Cannot add more. Only ${product.quantity} in stock.`)
        return
      }
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId, delta) => {
    setError('')
    const item = cart.find(i => i.product.id === productId)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty <= 0) removeFromCart(productId)
    else if (newQty > item.product.quantity) setError(`Cannot add more. Only ${item.product.quantity} in stock.`)
    else setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i))
  }

  const removeFromCart = (productId) => setCart(cart.filter(i => i.product.id !== productId))

  const total = cart.reduce((sum, item) => sum + (Number(item.product.selling_price) * item.quantity), 0)
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())))

  const handleCheckoutClick = () => {
    if (cart.length === 0) return
    setIsConfirmOpen(true)
  }

  const handleConfirmCheckout = async () => {
    setProcessing(true)
    setError('')
    setIsConfirmOpen(false)

    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: Number(item.product.selling_price)
      }))

      const { data: saleId, error: saleError } = await supabase.rpc('process_sale', {
        p_business_id: business.id,
        p_total: total,
        p_items: items,
        p_created_by: profile.id
      })

      if (saleError) throw saleError

      setToast({ type: 'success', message: `Sale successful! KES ${total.toLocaleString()}` })
      
      // Wait for toast to be seen, then redirect
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
      
    } catch (error) {
      setError(error.message)
      setToast({ type: 'error', message: 'Failed to complete sale' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">New Sale</h1>
        <p className="text-slate-400">Select products to add to the cart</p>
      </div>

      {error && <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full p-12 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto mb-2" />Loading...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full p-12 text-center text-slate-400">No products in stock.</div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} onClick={() => addToCart(product)} className="card p-4 cursor-pointer hover:border-brand-400/50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white group-hover:text-brand-400 transition-colors">{product.name}</h3>
                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-slate-300">{product.quantity} left</span>
                  </div>
                  <p className="text-lg font-bold text-brand-400">KES {Number(product.selling_price).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 border border-white/10">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/10">
              <ShoppingCart className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white">Cart</h2>
              <span className="ml-auto bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full">{cart.length}</span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-white truncate">{item.product.name}</p>
                      <p className="text-slate-400 text-xs">KES {Number(item.product.selling_price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1 border border-white/5">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:text-brand-400 text-slate-400"><Minus className="w-4 h-4" /></button>
                      <span className="w-6 text-center font-medium text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:text-brand-400 text-slate-400"><Plus className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-slate-500 hover:text-danger ml-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">Total</span>
                <span className="text-2xl font-bold text-white">KES {total.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleCheckoutClick}
                disabled={cart.length === 0 || processing}
                className="btn-primary w-full py-3"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Complete Sale?"
        message={`You are about to process a sale of KES ${total.toLocaleString()} for ${cart.length} item(s). This will deduct stock and cannot be undone.`}
        confirmText="Yes, Complete Sale"
        cancelText="Cancel"
        type="info"
        onConfirm={handleConfirmCheckout}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* TOAST */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}