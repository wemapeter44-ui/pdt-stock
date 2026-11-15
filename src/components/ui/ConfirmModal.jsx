import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-navy-900 border border-navy-700 shadow-2xl animate-fade-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${type === 'danger' ? 'bg-danger/10' : 'bg-warning/10'}`}>
              <AlertTriangle className={`w-6 h-6 ${type === 'danger' ? 'text-danger' : 'text-warning'}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
            </div>
            <button onClick={onCancel} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-navy-950/50 border-t border-navy-800 rounded-b-xl">
          <button onClick={onCancel} className="btn-secondary">{cancelText}</button>
          <button 
            onClick={onConfirm} 
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-semibold text-sm text-white transition-all ${
              type === 'danger' ? 'bg-danger hover:bg-danger/90' : 'bg-warning hover:bg-warning/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}