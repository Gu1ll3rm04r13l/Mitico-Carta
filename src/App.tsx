import { useState } from 'react'
import Hero from './components/Hero'
import Menu from './components/Menu'
import ExperienceGallery from './components/ExperienceGallery'
import Footer from './components/Footer'
import ReservationModal from './components/ReservationModal'
import CancelReservationModal from './components/CancelReservationModal'
import ChatWidget from './components/ChatWidget'
import LogoM from './components/LogoM'
import type { ChatIntent } from './types'

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(true)

  // Chat — estado externo para poder abrirlo programáticamente
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatIntent, setChatIntent] = useState<ChatIntent>(null)

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
