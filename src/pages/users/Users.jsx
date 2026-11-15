import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Users as UsersIcon, Loader2, Plus, X } from 'lucide-react'

export default function Users() {
  const { business, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'cashier' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (business?.id) fetchUsers()
  }, [business])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (formData.password.length < 6) throw new Error('Password must be at least 6 characters.')

      // Call the Supabase Edge Function we just deployed
      const { data, error: fnError } = await supabase.functions.invoke('create-team-member', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role
        }
      })

      if (fnError) throw fnError
      if (data.error) throw new Error(data.error)

      setFormData({ full_name: '', email: '', password: '', role: 'cashier' })
      setIsModalOpen(false)
      fetchUsers()
    } catch (error) {
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canAddUser = profile?.role === 'owner' || profile?.role === 'manager'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Team Members</h1>
          <p className="text-slate-400">Manage who has access to your business</p>
        </div>
        {canAddUser && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="w-5 h-5" /> Add Team Member
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-navy-900/50 border-b border-navy-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-navy-800/50">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                    {u.full_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize bg-navy-700 px-2 py-1 rounded text-xs font-medium text-cyan-400">{u.role}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-navy-900 border border-navy-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-navy-800">
              <h2 className="text-xl font-bold text-white">Add Team Member</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {error && <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-lg text-sm">{error}</div>}
              <div><label className="label">Full Name</label><input type="text" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="input" placeholder="e.g. Juma Omondi" /></div>
              <div><label className="label">Email Address</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input" placeholder="juma@example.com" /></div>
              <div><label className="label">Temporary Password</label><input type="text" required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="input" placeholder="Min 6 characters" /></div>
              <div>
                <label className="label">Role</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="input">
                  <option value="cashier">Cashier (Sales only)</option>
                  <option value="manager">Manager (Sales, Products, Reports)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-navy-800 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[120px]">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}