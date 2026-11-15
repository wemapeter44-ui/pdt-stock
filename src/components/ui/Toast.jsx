import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const styles = {
    success: { bg: 'bg-success/10 border-success/30', text: 'text-success', icon: CheckCircle },
    error: { bg: 'bg-danger/10 border-danger/30', text: 'text-danger', icon: XCircle },
    info: { bg: 'bg-cyan-400/10 border-cyan-400/30', text: 'text-cyan-400', icon: Info },
  }
  const style = styles[type] || styles.info
  const Icon = style.icon

  return (
    <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-in ${style.bg}`}>
      <Icon className={`w-5 h-5 ${style.text} shrink-0`} />
      <p className="text-sm text-white font-medium">{message}</p>
      <button onClick={onClose} className="text-slate-400 hover:text-white ml-2"><X className="w-4 h-4" /></button>
    </div>
  )
}