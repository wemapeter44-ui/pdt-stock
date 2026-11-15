import { useAuth } from '../../context/AuthContext'
import { AlertCircle, CreditCard, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function SubscriptionExpired() {
  const { business, logout } = useAuth()
  const navigate = useNavigate()

  const isTrialExpired = business?.subscription_status === 'expired' && !business?.subscription_ends_at
  const hasNeverPaid = business?.subscription_status === 'trial'

  const title = hasNeverPaid ? 'Your Trial Has Ended' : 'Your Subscription Has Expired'
  const message = hasNeverPaid 
    ? 'Your 14-day free trial has come to an end. To continue using PDT Stock and accessing your business data, please choose a plan below.' 
    : 'Your subscription has expired. To regain access to your inventory, sales, and reports, please renew your subscription.'

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      <div className="card max-w-lg w-full p-8 text-center border-t-4 border-t-danger">
        <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-danger" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
        <p className="text-slate-400 mb-8">{message}</p>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('/subscription')} 
            className="btn-primary w-full py-3"
          >
            <CreditCard className="w-5 h-5" /> Choose a Plan & Pay
          </button>
          
          <button 
            onClick={logout} 
            className="btn-secondary w-full py-3"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Need help? Contact support at support@pdtstock.com
        </p>
      </div>
    </div>
  )
}