import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#030712] flex print:bg-white relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0ea5e9]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#22d3ee]/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="print:hidden relative z-20">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>
      
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen print:ml-0 relative z-10">
        <div className="print:hidden">
          <Topbar setIsOpen={setIsSidebarOpen} />
        </div>
        
        <main className="flex-1 p-6 md:p-8 print:p-0">
          <div className="max-w-6xl mx-auto print:max-w-none print:w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}