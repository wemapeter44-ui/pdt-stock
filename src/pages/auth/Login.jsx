import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Mail, Lock, Loader2, ArrowRight, BarChart3, Box, FileText, ShieldCheck, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#030712] relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* LEFT SIDE - Branding & Features (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center p-12 xl:p-20 relative z-10">
        
        {/* Logo */}
        <div className="flex items-center gap-4 mb-16 animate-slide-up">
          <img src="/Logo.png" alt="Logo" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">PDT Stock</h1>
            <p className="text-brand-400 font-medium">by PDT Softwares</p>
          </div>
        </div>

        {/* Main Heading */}
        <h2 className="text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Smarter Stock <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Management</span>
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Track. Manage. Grow. Powerful inventory and sales management for your business.
        </p>

        {/* Features List */}
        <div className="space-y-6 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { icon: BarChart3, text: 'Track Sales & Stock' },
            { icon: Box, text: 'Manage Products' },
            { icon: FileText, text: 'Get Real Reports' },
            { icon: ShieldCheck, text: 'Secure & Reliable' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-brand-400" />
              </div>
              <span className="text-slate-300 font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Pill */}
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3 w-fit animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <span className="text-2xl">🚀</span>
          <p className="text-sm text-slate-300">Join thousands of Kenyan businesses using <strong className="text-white">PDT Stock</strong> today.</p>
        </div>
      </div>

      {/* RIGHT SIDE - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md bg-[#0B1120]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl animate-float">
          
          {/* Mobile Logo (Shows only on small screens) */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <img src="/Logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">PDT Stock</h1>
              <p className="text-brand-400 text-xs font-medium">by PDT Softwares</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-slate-400">Sign in to your PDT Stock account</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="input pl-12 bg-black/40 text-white border-white/10 focus:border-brand-500 focus:ring-brand-500/50" 
                  placeholder="Enter your email" 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="input pl-12 pr-12 bg-black/40 text-white border-white/10 focus:border-brand-500 focus:ring-brand-500/50" 
                  placeholder="Enter your password" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-black/20 accent-brand-500" />
              <span className="text-sm text-slate-400">Remember me</span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing In...</> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">Register Now</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 w-full text-center z-10 pointer-events-none hidden sm:block">
        <p className="text-xs text-slate-500">
          PDT Stock • by PDT Softwares | Simple. Fast. Powerful.
        </p>
      </div>
    </div>
  )
}