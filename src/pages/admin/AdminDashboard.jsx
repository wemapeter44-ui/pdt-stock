import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Users, CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Toast from '../../components/ui/Toast'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('businesses')
  
  const [approveTarget, setApproveTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: bizData, error: bizError } = await supabase
        .from('businesses').select(`*, profiles (count)`).order('created_at', { ascending: false })
      if (bizError) throw bizError
      setBusinesses(bizData || [])

      const { data: payData, error: payError } = await supabase
        .from('payment_requests').select(`*, businesses (name), subscription_plans (name, duration_days)`)
        .eq('status', 'pending').order('created_at', { ascending: false })
      if (payError) throw payError
      setPayments(payData || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!approveTarget) return
    const payment = approveTarget

    try {
      const { error: payError } = await supabase
        .from('payment_requests').update({ status: 'approved', reviewed_by: profile.id, reviewed_at: new Date() })
        .eq('id', payment.id)
      if (payError) throw payError

      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + payment.subscription_plans.duration_days)

      const { error: subError } = await supabase
        .from('subscriptions').insert({
          business_id: payment.business_id, plan_id: payment.plan_id, status: 'active',
          ends_at: endsAt.toISOString(), created_by: profile.id
        })
      if (subError) throw subError

      const { error: bizError } = await supabase
        .from('businesses').update({ 
          subscription_status: 'active', subscription_ends_at: endsAt.toISOString()
        }).eq('id', payment.business_id)
      if (bizError) throw bizError

      setToast({ type: 'success', message: 'Payment approved!' })
      setApproveTarget(null)
      fetchData()
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Platform Admin</h1>
          <p className="text-slate-400">Manage all registered businesses on PDT Stock</p>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} className="btn-secondary">
          Back to My Business
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-navy-800">
        <button onClick={() => setActiveTab('businesses')} className={`pb-3 font-medium text-sm transition-colors ${activeTab === 'businesses' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          Businesses
        </button>
        <button onClick={() => setActiveTab('payments')} className={`pb-3 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'payments' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          Pending Payments
          {payments.length > 0 && <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full">{payments.length}</span>}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
      ) : activeTab === 'businesses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz) => (
            <div key={biz.id} className="card p-6 border-l-4 border-l-cyan-400">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{biz.name}</h3>
                  <p className="text-slate-400 text-sm">Owner ID: {biz.created_by?.slice(0, 8)}...</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                  biz.subscription_status === 'active' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                }`}>
                  {biz.subscription_status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-300 mb-6">
                <p className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> {biz.profiles?.[0]?.count || 0} Team Members</p>
                <p className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-slate-500" /> Trial Ends: {new Date(biz.trial_ends_at).toLocaleDateString()}</p>
                {biz.subscription_ends_at && (
                  <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> Sub Ends: {new Date(biz.subscription_ends_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="card p-12 text-center text-slate-400">No pending payments right now.</div>
          ) : (
            payments.map((pay) => (
              <div key={pay.id} className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{pay.businesses?.name}</h3>
                  <p className="text-sm text-slate-400">Plan: <span className="text-cyan-400 font-medium">{pay.subscription_plans?.name}</span> ({pay.subscription_plans?.duration_days} days)</p>
                  <p className="text-sm text-slate-400">Amount: <span className="text-white font-medium">KES {pay.amount_kes.toLocaleString()}</span></p>
                </div>
                <div className="bg-navy-900 p-4 rounded-lg border border-navy-700 w-full md:w-auto">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">M-Pesa Reference</p>
                  <p className="text-lg font-mono text-cyan-400 font-bold">{pay.payment_reference}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setApproveTarget(pay)} className="btn-primary bg-success hover:bg-success/90 text-white border-none">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button className="btn-secondary text-danger hover:bg-danger/10">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!approveTarget}
        title="Approve Payment?"
        message={`Activate ${approveTarget?.subscription_plans?.name} plan for ${approveTarget?.businesses?.name}? This will grant access for ${approveTarget?.subscription_plans?.duration_days} days.`}
        confirmText="Approve & Activate"
        type="info"
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}