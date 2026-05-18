import { useState, useEffect, lazy, Suspense } from 'react'
import Hero from './components/Hero'
import Menu from './components/Menu'
import ExperienceGallery from './components/ExperienceGallery'
import Footer from './components/Footer'
import ReservationModal from './components/ReservationModal'
import CancelReservationModal from './components/CancelReservationModal'
import ChatWidget from './components/ChatWidget'
import LogoM from './components/LogoM'
import { supabase } from './lib/supabase'
import type { ChatIntent } from './types'
import type { Session } from '@supabase/supabase-js'

const AdminLogin = lazy(() => import('./components/admin/AdminLogin'))
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'))

const IS_ADMIN_ROUTE =
  new URLSearchParams(window.location.search).get('access') === import.meta.env.VITE_ADMIN_TOKEN

function AdminLoader() {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <p className="text-muted font-body text-sm animate-pulse">Cargando panel…</p>
    </div>
  )
}

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatIntent, setChatIntent] = useState<ChatIntent>(null)

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

  if (IS_ADMIN_ROUTE) {
    if (authLoading) return <AdminLoader />
    return (
      <Suspense fallback={<AdminLoader />}>
        {!session ? <AdminLogin onSuccess={() => {}} /> : <AdminPanel />}
      </Suspense>
    )
  }

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
