import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Orders } from './pages/Orders'
import { Retention } from './pages/Retention'
import { Fleet } from './pages/Fleet'
import { Margin } from './pages/Margin'
import { Inventory } from './pages/Inventory'
import { Login } from './pages/Login'
import { Settings } from './pages/Settings'
import { Mechanics } from './pages/Mechanics'
import { Sales } from './pages/Sales'
import { Reports } from './pages/Reports'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-emerald-500 font-bold text-xl tracking-widest">TORQUE IA</div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/retention" element={<Retention />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/margin" element={<Margin />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/mechanics" element={<Mechanics />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}