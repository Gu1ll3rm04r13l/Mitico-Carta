import { useState, useEffect } from 'react'
import Hero from './components/Hero'
import Menu from './components/Menu'
import ExperienceGallery from './components/ExperienceGallery'
import Footer from './components/Footer'
import ReservationModal from './components/ReservationModal'
import CancelReservationModal from './components/CancelReservationModal'
import ChatWidget from './components/ChatWidget'
import LogoM from './components/LogoM'
import AdminLogin from './components/admin/AdminLogin'
import AdminPanel from './components/admin/AdminPanel'
import { supabase } from './lib/supabase'
import type { ChatIntent } from './types'
import type { Session } from '@supabase/supabase-js'

const IS_ADMIN_ROUTE = new URLSearchParams(window.location.search).has('admin')

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatIntent, setChatIntent] = useState<ChatIntent>(null)

  // Admin auth state
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(IS_ADMIN_ROUTE)

  useEffect(() => {
    if (!IS_ADMIN_ROUTE) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Admin mode ─────────────────────────────────────────────────────────────
  if (IS_ADMIN_ROUTE) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-bg-deep flex items-center justify-center">
          <p className="text-muted font-body text-sm animate-pulse">Verificando sesión…</p>
        </div>
      )
    }
    if (!session) return <AdminLogin onSuccess={() => {}} />
    return <AdminPanel />
  }

  // ── Landing ────────────────────────────────────────────────────────────────
  const handleOrderClick = () => {
    setChatIntent('order')
    setIsChatOpen(true)
  }

  return (
    <main>
      <LogoM />
      <Hero
        onReserveClick={() => setIsReservationOpen(true)}
        onOrderClick={handleOrderClick}
        onMenuClick={() => setIsMenuOpen(true)}
      />
      <Menu isOpen={isMenuOpen} onToggle={() => setIsMenuOpen(prev => !prev)} />
      <ExperienceGallery />
      <Footer onCancelClick={() => setIsCancelOpen(true)} />

      {isReservationOpen && (
        <ReservationModal onClose={() => setIsReservationOpen(false)} />
      )}
      {isCancelOpen && (
        <CancelReservationModal onClose={() => setIsCancelOpen(false)} />
      )}

      <ChatWidget
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        intent={chatIntent}
        onIntentHandled={() => setChatIntent(null)}
      />
    </main>
  )
}
