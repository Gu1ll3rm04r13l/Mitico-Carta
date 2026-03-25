import { useState } from 'react'
import Hero from './components/Hero'
import Menu from './components/Menu'
import Footer from './components/Footer'
import ReservationModal from './components/ReservationModal'
import CancelReservationModal from './components/CancelReservationModal'

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  return (
    <main>
      <Hero onReserveClick={() => setIsReservationOpen(true)} />
      <Menu />
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
