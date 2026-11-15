import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [business, setBusiness] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchUserData(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setBusiness(null)
        setNotifications([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!business?.id) return

    const channel = supabase.channel(`business_changes_${business.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'businesses', filter: `id=eq.${business.id}` }, 
        (payload) => setBusiness(payload.new)
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `business_id=eq.${business.id}` }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
          if (Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/favicon.ico'
            })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [business?.id])

  async function fetchUserData(userId) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) throw profileError
      
      if (profileData) {
        setProfile(profileData)
        
        if (profileData.business_id) {
          const { data: businessData, error: bizError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', profileData.business_id)
            .maybeSingle()
            
          if (!bizError && businessData) {
            setBusiness(businessData)
            fetchNotifications(businessData.id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNotifications(businessId) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data || [])
  }

  async function markNotificationRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function deleteNotification(id) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function requestNotificationPermission() {
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  async function refreshBusiness() {
    if (!profile?.business_id) return
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', profile.business_id)
      .maybeSingle()
    if (data) setBusiness(data)
  }

  // --- PROFILE UPDATE ---
  async function updateProfile(newName) {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', user.id)
    
    if (error) throw error
    setProfile(prev => ({ ...prev, full_name: newName }))
  }

  // --- PASSWORD UPDATE ---
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  async function registerBusiness(email, password, fullName, businessName, phone) {
    const { error } = await supabase.auth.signUp({ 
      email, password,
      options: { data: { full_name: fullName, business_name: businessName, phone: phone } }
    })
    if (error) throw error
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, profile, business, notifications, loading,
      registerBusiness, login, logout, refreshBusiness,
      markNotificationRead, deleteNotification, requestNotificationPermission,
      updateProfile, updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)