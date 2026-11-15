import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Store, User, Mail, Lock, Phone, Loader2 } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { registerBusiness } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await registerBusiness(formData.email, formData.password, formData.fullName, formData.businessName, formData.phone)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy-950 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/Logo.png" alt="PDT Stock" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-slate-400 text-sm">Start managing your business with PDT Stock</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Business Name</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" name="businessName" required value={formData.businessName} onChange={handleChange} className="input pl-10" placeholder="e.g. Peter's Hardware" />
            </div>
          </div>

          <div>
            <label className="label">Your Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} className="input pl-10" placeholder="e.g. Peter Dekko" />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input pl-10" placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="label">Phone Number (M-Pesa)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="input pl-10" placeholder="07XX XXX XXX" />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input type="password" name="password" required minLength={6} value={formData.password} onChange={handleChange} className="input pl-10" placeholder="Minimum 6 characters" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</> : 'Create Business Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">Sign In</Link>
        </p>
      </div>

      <p className="text-xs text-slate-500 mt-6 text-center">
        © {new Date().getFullYear()} PDT Softwares (Peter Dekko Tech Tricks). All rights reserved.
      </p>
    </div>
  )
}