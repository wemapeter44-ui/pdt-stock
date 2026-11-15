import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle2, Clock, Loader2, Send, Star } from 'lucide-react'

export default function Subscription() {
  const { business, profile } = useAuth()
  const [plans, setPlans] = useState([])
  const [currentSub, setCurrentSub] = useState(null)
  const [pendingPayment, setPendingPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [mpesaCode, setMpesaCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (business?.id) fetchData()
  }, [business])

  useEffect(() => {
    if (!business?.id) return

    const channel = supabase.channel('subscription_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `business_id=eq.${business.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests', filter: `business_id=eq.${business.id}` }, () => fetchData())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [business?.id])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: plansData } = await supabase.from('subscription_plans').select('*').order('price_kes', { ascending: true })
      setPlans(plansData || [])

      const { data: subData } = await supabase.from('subscriptions').select(`*, subscription_plans (*)`)
        .eq('business_id', business.id).eq('status', 'active').gte('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: false }).limit(1).maybeSingle()
      setCurrentSub(subData)

      const { data: pendingData } = await supabase.from('payment_requests').select(`*, subscription_plans (name)`)
        .eq('business_id', business.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle()
      setPendingPayment(pendingData)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPayment = async (e) => {
    e.preventDefault()
    if (!selectedPlan || !mpesaCode) return
    
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase.from('payment_requests').insert({
        business_id: business.id, plan_id: selectedPlan.id, amount_kes: selectedPlan.price_kes,
        payment_reference: mpesaCode.toUpperCase(), status: 'pending'
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Payment submitted! We will verify your M-Pesa code and activate your account shortly.' })
      setMpesaCode('')
      setSelectedPlan(null)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>

  if (pendingPayment) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="card p-12 border-t-4 border-t-warning bg-[#0B1120]/80">
          <Clock className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Payment Pending Review</h2>
          <p className="text-slate-400 mb-6">
            You submitted M-Pesa code <strong className="text-brand-400">{pendingPayment.payment_reference}</strong> for the {pendingPayment.subscription_plans?.name} plan.
            We are verifying your payment and will activate your account shortly.
          </p>
        </div>
      </div>
    )
  }

  if (currentSub) {
    const now = new Date()
    const endDate = new Date(currentSub.ends_at)
    const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))

    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">My Subscription</h1>
          <p className="text-slate-400">Manage your billing and plan</p>
        </div>

        <div className="card p-8 border-l-4 border-l-success bg-[#0B1120]/80">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Active</span>
              <h2 className="text-3xl font-bold text-white mt-3">{currentSub.subscription_plans.name} Plan</h2>
            </div>
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-white/10">
            <div>
              <p className="text-sm text-slate-400 mb-1">Amount Paid</p>
              <p className="text-xl font-bold text-white">KES {currentSub.subscription_plans.price_kes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Expires On</p>
              <p className="text-xl font-bold text-white">{endDate.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Time Remaining</p>
              <p className={`text-xl font-bold ${daysLeft <= 5 ? 'text-danger' : 'text-brand-400'}`}>
                {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Choose a Plan</h1>
        <p className="text-slate-400">Select a plan to keep using PDT Stock</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl border text-sm max-w-2xl mx-auto ${message.type === 'success' ? 'bg-success/10 border-success/50 text-success' : 'bg-danger/10 border-danger/50 text-danger'}`}>
          {message.text}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-start">
        {plans.map((plan, index) => {
          const isRecommended = plan.name === 'Business'
          const isSelected = selectedPlan?.id === plan.id
          
          return (
            <div 
              key={plan.id} 
              onClick={() => setSelectedPlan(plan)}
              className={`relative cursor-pointer transition-all duration-300 ${
                isSelected ? 'transform scale-105 z-10' : 'hover:-translate-y-1'
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gradient text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-glow-cyan z-20 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Recommended
                </div>
              )}
              
              <div className={`card p-6 h-full flex flex-col bg-[#0B1120]/60 ${
                isSelected ? 'ring-2 ring-brand-400 border-transparent shadow-[0_0_30px_rgba(34,211,238,0.15)]' : ''
              } ${isRecommended ? 'border-brand-500/30' : ''}`}>
                
                <div className="mb-6 border-b border-white/10 pb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">KES {plan.price_kes.toLocaleString()}</span>
                    <span className="text-slate-400 text-sm">/ month</span>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {plan.name === 'Starter' && 'For small shops getting started.'}
                    {plan.name === 'Business' && 'For growing businesses.'}
                    {plan.name === 'Premium' && 'For established businesses.'}
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-slate-300 mb-8 flex-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <span>Up to {plan.product_limit === 999999 ? 'Unlimited' : plan.product_limit} products {plan.product_limit === 999999 && '(fair-use policy)'}</span>
                  </li>
                  {plan.name === 'Business' && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      <span>Everything in Starter</span>
                    </li>
                  )}
                  {plan.name === 'Premium' && (
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      <span>Everything in Business</span>
                    </li>
                  )}
                  
                  {/* Features from DB */}
                  {plan.features && plan.features.map((feature, i) => {
                    // Skip "Everything in..." if already hardcoded above to avoid duplication
                    if (feature.includes('Everything in')) return null
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    )
                  })}

                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <span>Up to {plan.user_limit} user account{plan.user_limit > 1 ? 's' : ''}</span>
                  </li>
                </ul>

                <button 
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isSelected 
                      ? 'bg-brand-gradient text-white shadow-glow-cyan' 
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Form */}
      {selectedPlan && (
        <div className="card p-8 max-w-2xl mx-auto border-t-4 border-t-brand-400 bg-[#0B1120]/80 animate-slide-up">
          <h3 className="text-xl font-bold text-white mb-6">Pay via M-Pesa</h3>
          
          <div className="bg-black/30 p-6 rounded-xl border border-white/10 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Paybill / Till Number</p>
                <p className="text-2xl font-bold text-white">123456</p> {/* BADILISHA HII */}
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Amount to Pay</p>
                <p className="text-2xl font-bold text-white">KES {selectedPlan.price_kes.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div>
              <label className="label">M-Pesa Reference Code</label>
              <input 
                type="text" required value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value)}
                className="input font-mono uppercase text-lg" placeholder="e.g. QJK4X7Y2" maxLength={10}
              />
            </div>
            <button type="submit" disabled={submitting || !mpesaCode} className="btn-primary w-full py-3">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Payment</>}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}