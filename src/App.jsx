import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/dashboard/Dashboard'
import Products from './pages/products/Products'
import ArchivedProducts from './pages/products/ArchivedProducts'
import NewSale from './pages/sales/NewSale'
import SalesHistory from './pages/sales/SalesHistory'
import Receipt from './pages/sales/Receipt'
import Users from './pages/users/Users'
import Subscription from './pages/subscription/Subscription'
import SubscriptionExpired from './pages/subscription/SubscriptionExpired'
import Reports from './pages/reports/Reports'
import StockHistory from './pages/stock/StockHistory'
import Settings from './pages/settings/Settings'
import AdminDashboard from './pages/admin/AdminDashboard'
import DashboardLayout from './components/layout/DashboardLayout'
import SubscriptionGuard from './components/shared/SubscriptionGuard'
import { Loader2, LogOut } from 'lucide-react'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy-950"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy-950"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (profile && !profile.is_platform_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white p-6 text-center">
        <h2 className="text-2xl font-bold text-danger mb-2">Access Denied</h2>
        <a href="/dashboard" className="btn-primary mt-4">Go to My Dashboard</a>
      </div>
    )
  }
  return children
}

function AppPage({ children }) {
  return (
    <ProtectedRoute>
      <SubscriptionGuard>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  const { user, loading, profile, logout } = useAuth()

  if (user && !profile && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 text-white p-6 text-center">
        <h2 className="text-2xl font-bold text-danger mb-2">Profile Missing</h2>
        <button onClick={logout} className="btn-primary mt-4"><LogOut className="w-4 h-4" /> Log Out</button>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route path="/dashboard" element={<AppPage><Dashboard /></AppPage>} />
      <Route path="/products" element={<AppPage><Products /></AppPage>} />
      <Route path="/products/archived" element={<AppPage><ArchivedProducts /></AppPage>} />
      <Route path="/sales/new" element={<AppPage><NewSale /></AppPage>} />
      <Route path="/sales/history" element={<AppPage><SalesHistory /></AppPage>} />
      <Route path="/sales/receipt/:id" element={<AppPage><Receipt /></AppPage>} />
      <Route path="/users" element={<AppPage><Users /></AppPage>} />
      <Route path="/reports" element={<AppPage><Reports /></AppPage>} />
      <Route path="/stock" element={<AppPage><StockHistory /></AppPage>} />
      <Route path="/settings" element={<AppPage><Settings /></AppPage>} />
      
      <Route path="/subscription" element={<ProtectedRoute><DashboardLayout><Subscription /></DashboardLayout></ProtectedRoute>} />
      <Route path="/subscription/expired" element={<ProtectedRoute><SubscriptionExpired /></ProtectedRoute>} />
      
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}