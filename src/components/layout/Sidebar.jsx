import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, Package, ShoppingCart, Receipt,
  History, BarChart3, Users, Settings, LogOut, CreditCard 
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'cashier'] },
  { name: 'New Sale', path: '/sales/new', icon: ShoppingCart, roles: ['owner', 'manager', 'cashier'] },
  { name: 'Sales History', path: '/sales/history', icon: Receipt, roles: ['owner', 'manager', 'cashier'] },
  { name: 'Products', path: '/products', icon: Package, roles: ['owner', 'manager'] },
  { name: 'Stock History', path: '/stock', icon: History, roles: ['owner', 'manager'] },
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['owner', 'manager'] },
  { name: 'Users', path: '/users', icon: Users, roles: ['owner'] },
  { name: 'Subscription', path: '/subscription', icon: CreditCard, roles: ['owner'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['owner'] },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  const { business, profile, logout } = useAuth()
  
  const allowedNavItems = navItems.filter(item => item.roles.includes(profile?.role))

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-surface/40 backdrop-blur-2xl border-r border-white/5 z-50
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6">
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center mr-3 shadow-glow-cyan">
            {business?.logo_url ? (
              <img src={business.logo_url} alt="Logo" className="w-full h-full object-contain p-1 rounded-xl bg-white" />
            ) : (
              <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
            )}
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight block leading-tight">
              {business?.name || 'PDT Stock'}
            </span>
            <span className="text-[10px] text-brand-400 font-medium tracking-wide uppercase">Management</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive 
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-black/30 rounded-xl p-4 mb-4 border border-white/5">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Logged In As</p>
            <p className="text-sm font-bold text-white truncate">{profile?.full_name}</p>
            <p className="text-xs text-brand-400 capitalize mt-0.5">{profile?.role}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-danger/10 hover:text-danger transition-colors">
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </aside>
    </>
  )
}