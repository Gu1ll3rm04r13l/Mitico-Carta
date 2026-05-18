const START_HOUR = 20
const END_HOUR = 23

export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  slots.push('00:00')
  return slots
}

export const TIME_SLOTS = generateTimeSlots()
