import { useState, useEffect, useRef } from 'react'
import { Menu, Bell, Search, Package, Clock, Check, Trash2, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ setIsOpen }) {
  const { profile, business, notifications, markNotificationRead, deleteNotification, requestNotificationPermission } = useAuth()
  const navigate = useNavigate()
  
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ products: [], sales: [] })
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  const notifRef = useRef(null)
  const searchRef = useRef(null)
  
  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false)
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!searchQuery || !business?.id) {
      setSearchResults({ products: [], sales: [] })
      return
    }

    const timer = setTimeout(async () => {
      try {
        const { data: prods } = await supabase
          .from('products').select('id, name, selling_price').eq('business_id', business.id).eq('is_archived', false)
          .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`).limit(3)

        const { data: salesData } = await supabase
          .from('sales').select('id, total, created_at').eq('business_id', business.id)
          .or(`id::text.ilike.%${searchQuery}%,total::text.ilike.%${searchQuery}%`).order('created_at', { ascending: false }).limit(3)

        setSearchResults({ products: prods || [], sales: salesData || [] })
        setIsSearchOpen(true)
      } catch (error) {
        console.error(error)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, business])

  const handleResultClick = (type, item) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    if (type === 'product') navigate('/products')
    else if (type === 'sale') navigate(`/sales/receipt/${item.id}`)
  }

  const hasResults = searchResults.products.length > 0 || searchResults.sales.length > 0

  return (
    <header className="h-16 bg-[#030712]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button onClick={() => setIsOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Search Bar - Hides on Mobile, shows on Desktop */}
        <div className="hidden md:flex items-center relative" ref={searchRef}>
          <Search className="w-4 h-4 text-slate-500 absolute left-3 z-10" />
          <input 
            type="text" 
            placeholder="Search products or sales..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery) setIsSearchOpen(true) }}
            className="bg-black/20 border border-white/10 text-sm text-white rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-brand-500 w-64 z-10 relative"
          />

          {isSearchOpen && searchQuery && (
            <div className="absolute top-12 left-0 w-80 bg-[#0B1120] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              {!hasResults ? (
                <div className="p-4 text-center text-sm text-slate-500">No results for "{searchQuery}"</div>
              ) : (
                <div className="py-2 max-h-96 overflow-y-auto">
                  {searchResults.products.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase font-bold text-slate-500 px-4 py-1 tracking-wider">Products</p>
                      {searchResults.products.map(p => (
                        <div key={p.id} onClick={() => handleResultClick('product', p)} className="px-4 py-2 hover:bg-white/5 cursor-pointer flex justify-between items-center">
                          <span className="text-sm text-white truncate">{p.name}</span>
                          <span className="text-xs text-brand-400">KES {Number(p.selling_price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults.sales.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500 px-4 py-1 tracking-wider">Sales</p>
                      {searchResults.sales.map(s => (
                        <div key={s.id} onClick={() => handleResultClick('sale', s)} className="px-4 py-2 hover:bg-white/5 cursor-pointer flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-sm text-slate-300">#{s.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-brand-400">KES {Number(s.total).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Button (Optional) - For now, just space */}
        <button className="md:hidden p-2 text-slate-400 hover:text-white">
          <Search className="w-5 h-5" />
        </button>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 text-slate-400 hover:text-white relative transition-colors rounded-xl hover:bg-white/5">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-[#030712]"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-[#0B1120] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="font-semibold text-white text-sm">Notifications</h3>
                <span className="text-[10px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">{unreadCount} unread</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 border-b border-white/5 transition-colors flex gap-3 group ${notif.is_read ? 'opacity-50' : 'bg-white/5'}`}>
                      <div className={`mt-0.5 shrink-0 ${notif.type === 'danger' ? 'text-danger' : notif.type === 'warning' ? 'text-warning' : 'text-brand-400'}`}>
                        {notif.type === 'danger' ? <Clock className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => { if(!notif.is_read) markNotificationRead(notif.id); if(notif.link) { navigate(notif.link); setIsNotifOpen(false) } }}>
                        <p className={`text-sm font-medium ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>{notif.title}</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                      </div>
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.is_read && (
                          <button onClick={() => markNotificationRead(notif.id)} className="text-slate-500 hover:text-brand-400"><Check className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => deleteNotification(notif.id)} className="text-slate-500 hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 border-l border-white/10 pl-2 sm:pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-white leading-tight">{profile?.full_name}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center text-brand-400 text-xs font-bold">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}