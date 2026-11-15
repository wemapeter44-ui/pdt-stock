import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Save, Loader2, Store, Phone, MapPin, 
  User, Mail, Shield, AlertTriangle, Camera, Lock 
} from 'lucide-react'
import Toast from '../../components/ui/Toast'

export default function Settings() {
  const { business, profile, refreshBusiness, updateProfile, updatePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('business')
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    name: business?.name || '',
    phone: business?.phone || '',
    address: business?.address || '',
    logo_url: business?.logo_url || ''
  })

  const [profileName, setProfileName] = useState(profile?.full_name || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleLogoUpload = async (e) => {
    try {
      setUploading(true)
      const file = e.target.files[0]
      if (!file) return
      if (!file.type.startsWith('image/')) throw new Error('Please upload an image file.')
      if (file.size > 2 * 1024 * 1024) throw new Error('Logo must be less than 2MB')

      const fileExt = file.name.split('.').pop()
      const fileName = `${business.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('business-logos').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('business-logos').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, logo_url: publicUrl }))

      const { error: dbError } = await supabase.from('businesses').update({ logo_url: publicUrl }).eq('id', business.id)
      if (dbError) throw dbError

      await refreshBusiness()
      setToast({ type: 'success', message: 'Logo uploaded!' })
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    } finally {
      setUploading(false)
    }
  }

  const handleBusinessSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('businesses').update({ name: formData.name, phone: formData.phone, address: formData.address }).eq('id', business.id)
      if (error) throw error
      await refreshBusiness()
      setToast({ type: 'success', message: 'Business updated!' })
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await updateProfile(profileName)
      setToast({ type: 'success', message: 'Profile updated!' })
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setToast({ type: 'error', message: 'Passwords do not match' }); return }
    if (newPassword.length < 6) { setToast({ type: 'error', message: 'Min 6 characters required' }); return }
    setPasswordLoading(true)
    try {
      await updatePassword(newPassword)
      setToast({ type: 'success', message: 'Password changed!' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setToast({ type: 'error', message: error.message })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400">Manage your account and business preferences</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-navy-800 overflow-x-auto">
        <button onClick={() => setActiveTab('business')} className={`pb-3 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'business' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          <Store className="w-4 h-4" /> Business Profile
        </button>
        <button onClick={() => setActiveTab('account')} className={`pb-3 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'account' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          <User className="w-4 h-4" /> My Account
        </button>
        <button onClick={() => setActiveTab('danger')} className={`pb-3 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'danger' ? 'text-danger border-b-2 border-danger' : 'text-slate-400 hover:text-danger'}`}>
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </button>
      </div>

      {activeTab === 'business' && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-navy-700">
            <div className="p-3 bg-cyan-400/10 rounded-lg"><Store className="w-6 h-6 text-cyan-400" /></div>
            <div>
              <h2 className="font-bold text-white">Business Information</h2>
              <p className="text-sm text-slate-400">These details appear on your receipts</p>
            </div>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-navy-900 border-2 border-dashed border-navy-700 flex items-center justify-center overflow-hidden shrink-0">
              {formData.logo_url ? <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" /> : <Store className="w-10 h-10 text-slate-600" />}
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Business Logo</h3>
              <p className="text-sm text-slate-400 mb-3">PNG or JPG, up to 2MB.</p>
              <label className="btn-secondary cursor-pointer inline-flex">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4" /> Upload Logo</>}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          <form onSubmit={handleBusinessSave} className="space-y-4 pt-6 border-t border-navy-700">
            <div>
              <label className="label">Business Name</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="label">Physical Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input pl-10" />
              </div>
            </div>
            <div className="pt-4 mt-2 border-t border-navy-800">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-navy-700">
              <div className="p-3 bg-indigo-500/10 rounded-lg"><User className="w-6 h-6 text-indigo-400" /></div>
              <div>
                <h2 className="font-bold text-white">Profile Information</h2>
                <p className="text-sm text-slate-400">Update your personal details</p>
              </div>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="input pl-10" required />
                </div>
              </div>
              <div>
                <label className="label">Email Address (Cannot be changed)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="email" value={profile?.email || 'N/A'} readOnly className="input pl-10 opacity-60 cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-4 border-t border-navy-800">
                <button type="submit" disabled={profileLoading} className="btn-primary">
                  {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> Update Profile</>}
                </button>
              </div>
            </form>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-navy-700">
              <div className="p-3 bg-warning/10 rounded-lg"><Lock className="w-6 h-6 text-warning" /></div>
              <div>
                <h2 className="font-bold text-white">Change Password</h2>
                <p className="text-sm text-slate-400">Use a strong password</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input pl-10" required minLength={6} />
                </div>
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10" required minLength={6} />
                </div>
              </div>
              <div className="pt-4 border-t border-navy-800">
                <button type="submit" disabled={passwordLoading} className="btn-primary">
                  {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> Update Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="card p-6 border border-danger/30">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-danger/20">
            <div className="p-3 bg-danger/10 rounded-lg"><AlertTriangle className="w-6 h-6 text-danger" /></div>
            <div>
              <h2 className="font-bold text-danger">Danger Zone</h2>
              <p className="text-sm text-slate-400">Irreversible actions that affect your data</p>
            </div>
          </div>
          <div className="bg-navy-900 p-6 rounded-lg border border-navy-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white mb-1">Delete Business Account</h3>
              <p className="text-sm text-slate-400 max-w-md">Permanently delete your business, all products, sales history, and user accounts.</p>
            </div>
            <button disabled className="btn-secondary text-danger border-danger/50 opacity-50 cursor-not-allowed whitespace-nowrap">Delete Account</button>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}