import { useAuth } from '../../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

export default function SubscriptionGuard({ children }) {
  const { business, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (profile?.is_platform_admin) return children
  if (!business) return children

  // Kuruhusu kurasa za subscription (plans, expired screen)
  if (
    location.pathname === '/subscription' || 
    location.pathname === '/subscription/expired' ||
    location.pathname === '/admin'
  ) {
    return children
  }

  const now = new Date()
  const trialEnd = business.trial_ends_at ? new Date(business.trial_ends_at) : null
  const subEnd = business.subscription_ends_at ? new Date(business.subscription_ends_at) : null
  
  const isTrialActive = business.subscription_status === 'trial' && trialEnd && trialEnd.getTime() > now.getTime()
  const isSubActive = business.subscription_status === 'active' && subEnd && subEnd.getTime() > now.getTime()

  // Kama zote mbili zimeisha, mpeleke kwenye ukurasa wa ujumbe
  if (!isTrialActive && !isSubActive) {
    return <Navigate to="/subscription/expired" replace />
  }

  return children
}