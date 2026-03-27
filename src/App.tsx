import { useState } from 'react'
import Hero from './components/Hero'
import Menu from './components/Menu'
import ExperienceGallery from './components/ExperienceGallery'
import Footer from './components/Footer'
import ReservationModal from './components/ReservationModal'
import CancelReservationModal from './components/CancelReservationModal'

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(true)

  return (
    <main>
      <Hero
        onReserveClick={() => setIsReservationOpen(true)}
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
    </main>
  )
}
