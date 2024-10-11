'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../auth-provider'
import { getFirestore, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isSameMonth, isWeekend, isPast } from 'date-fns'

const db = getFirestore()

interface Entry {
  id: string
  date: string
  time: string
  users: string[]
}

const timeSlots = [
  { label: 'AM', time: '8:00 AM - 9:00 AM' },
  { label: 'PM', time: '2:15 PM - 3:15 PM' }
]

const holidays = [
  // 2023 Holidays
  '2023-01-01', '2023-01-16', '2023-02-20', '2023-05-29', '2023-07-04',
  '2023-09-04', '2023-10-09', '2023-11-11', '2023-11-23', '2023-12-25',
  // 2024 Holidays
  '2024-01-01', '2024-01-15', '2024-02-19', '2024-05-27', '2024-07-04',
  '2024-09-02', '2024-10-10', '2024-11-11','2024-11-20', '2024-11-28', '2024-12-25',
  '2024-11-25', '2024-11-26', '2024-11-27',  '2024-11-29', '2024-12-23',
  '2024-12-24', '2024-12-26', '2024-12-27', '2024-12-30', '2024-12-31',
  // 2025 Holidays
  '2025-01-01', '2024-01-02', '2024-01-03', '2024-01-09', '2025-01-20',
  '2025-02-17' , '2025-02-18' , '2025-02-19' , '2025-02-20','2025-02-21','2025-03-31',
  '2025-04-18' , '2025-04-21' , '2025-04-22' , '2025-04-23','2025-04-24','2025-04-25',
  '2025-05-26', '2025-07-04',
  '2025-09-01', '2025-10-13', '2025-11-11', '2025-11-27', '2025-12-25'
]

const isHoliday = (date: Date) => {
  const formattedDate = format(date, 'yyyy-MM-dd')
  return holidays.includes(formattedDate)
}

interface CalendarProps {
  currentDate: Date
  setCurrentDate: (date: Date) => void
}

interface UserData {
  id: string
  name: string
  email: string
}

export default function Calendar({ currentDate, setCurrentDate }: CalendarProps) {
  const { user, isAdmin } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const calendarRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    const q = query(
        collection(db, 'entries'),
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(endDate, 'yyyy-MM-dd'))
    )

    const uq = query(collection(db, 'users'))
    const unsubscribeUsers = onSnapshot(uq, (querySnapshot) => {
      const fetchedUsers: UserData[] = []
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as UserData)
      })
      setUsers(fetchedUsers)
    });

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedEntries: Entry[] = []
      querySnapshot.forEach((doc) => {
        fetchedEntries.push({ id: doc.id, ...doc.data() } as Entry)
      })
      setEntries(fetchedEntries)
    })

    return () => {
      unsubscribe()
      unsubscribeUsers()
    }
  }, [user, currentDate])

  const handleEntryClick = async (date: Date, time: string, slotIndex: number) => {
    if (!user || isWeekend(date) || isHoliday(date)) return

    const dateString = format(date, 'yyyy-MM-dd')
    const existingEntry = entries.find(entry => entry.date === dateString && entry.time === time)

    const confirmMessage = (action: string) =>
        `Are you sure you want to ${action} for the following slot?\n\nDate: ${format(date, 'MMMM d, yyyy')}\nTime: ${time}\nSlot: ${slotIndex + 1}`

    if (existingEntry) {
      const updatedUsers = [...existingEntry.users]
      if (updatedUsers[slotIndex] === user.uid) {
        // Remove user from the slot
        if (confirm(confirmMessage('remove your entry'))) {
          updatedUsers[slotIndex] = ''
          if (updatedUsers.every(u => u === '')) {
            await deleteDoc(doc(db, 'entries', existingEntry.id))
          } else {
            await updateDoc(doc(db, 'entries', existingEntry.id), { users: updatedUsers })
          }
        }
      } else if (updatedUsers[slotIndex] === '') {
        // Add user to the slot
        if (confirm(confirmMessage('sign up'))) {
          updatedUsers[slotIndex] = user.uid
          await updateDoc(doc(db, 'entries', existingEntry.id), { users: updatedUsers })
        }
      } else {
        if (isAdmin) {
          const slotUser = users.find(u => u.id === updatedUsers[slotIndex])
          if (confirm(`This slot is already taken by ${slotUser?.name || 'another user'}. Do you want to remove it?`)){
            updatedUsers[slotIndex] = ''
            if (updatedUsers.every(u => u === '')) {
              await deleteDoc(doc(db, 'entries', existingEntry.id))
            } else {
              await updateDoc(doc(db, 'entries', existingEntry.id), {users: updatedUsers})
            }
          }
        } else {
          const slotUser = users.find(u => u.id === updatedUsers[slotIndex])
          alert(`This slot is already taken by ${slotUser?.name || 'another user'}`)
        }
      }
    } else {
      // Create a new entry
      if (confirm(confirmMessage('sign up'))) {
        const newUsers = ['', '', '', '']
        newUsers[slotIndex] = user.uid
        await addDoc(collection(db, 'entries'), {
          date: dateString,
          time,
          users: newUsers
        })
      }
    }
  }

  const renderTimeSlot = (date: Date, { label, time }: { label: string; time: string }) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const entry = entries.find(e => e.date === dateString && e.time === time)
    const isDisabled = isWeekend(date) || isHoliday(date)

    const getSlotColor = (userId: string) => {
      if (isDisabled) return 'bg-gray-300'
      if (userId === '') return 'bg-green-500'
      if (userId === user?.uid) return 'bg-amber-500'
      return 'bg-red-500'
    }

    return (
        <div className="mb-1 last:mb-0">
          <div className="text-xs font-semibold mb-0.5">{label}</div>
          <div
              className={`h-6 w-full ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} flex space-x-0.5 border border-gray-300 rounded overflow-hidden`}
              role={isDisabled ? 'presentation' : 'group'}
              aria-disabled={isDisabled}
          >
            {[0, 1, 2, 3].map((index) => (
                <div
                    key={index}
                    className={`h-full w-1/4 ${getSlotColor(entry?.users[index] || '')} ${
                        !isDisabled ? 'group-hover:opacity-80' : ''
                    }`}
                    onClick={() => !isDisabled && handleEntryClick(date, time, index)}
                    role={isDisabled ? 'presentation' : 'button'}
                    aria-label={`Slot ${index + 1} for ${time}`}
                />
            ))}
          </div>
        </div>
    )
  }

  const renderDay = (date: Date) => {
    const dayString = format(date, 'd')
    const isCurrentMonth = isSameMonth(date, currentDate)
    const isCurrentDay = isToday(date)
    const isDisabled = isWeekend(date) || isHoliday(date)
    const isPastDay = isPast(date)

    return (
        <div
            key={date.toString()}
            className={`border p-1 ${isCurrentMonth ? '' : 'bg-gray-100'} ${
                isCurrentDay ? 'bg-yellow-900' : ''
            } ${isDisabled ? 'bg-gray-200' : ''} ${isPastDay ? 'bg-gray-100' : ''}`}
        >
          <div className={`text-xs mb-1 ${isDisabled ? 'text-gray-500' : ''} ${isPastDay ? 'text-gray-400' : ''}`}>{dayString}</div>
          <div className="space-y-1">
            {timeSlots.map(slot => renderTimeSlot(date, slot))}
          </div>
        </div>
    )
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    if (isLeftSwipe) {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
    if (isRightSwipe) {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }

  return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Volunteer Calendar</h2>
        <div className="flex justify-between items-center mb-4">
          <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Previous Month
          </button>
          <h3 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
          <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Next Month
          </button>
        </div>
        <div
            ref={calendarRef}
            className="grid grid-cols-5 gap-1"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
              <div key={day} className="text-center font-bold">
                {day}
              </div>
          ))}
          {Array.from({ length: startOfMonth(currentDate).getDay() -1 }).map((_, index) => (
              <div key={`empty-${index}`} className="border p-1"></div>
          ))}
          {daysInMonth.filter(day=>!isWeekend(day)).map(renderDay)}
        </div>
        <div className="mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 mr-2 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center mt-1">
            <div className="w-4 h-4 bg-amber-500 mr-2 rounded"></div>
            <span>Signed up by you</span>
          </div>
          <div className="flex items-center mt-1">
            <div className="w-4 h-4 bg-red-500 mr-2 rounded"></div>
            <span>Signed up by someone else</span>
          </div>
          <div className="flex items-center mt-1">
            <div className="w-4 h-4 bg-gray-300 mr-2 rounded"></div>
            <span>Weekend/Holiday (Not Available)</span>
          </div>
          <div className="flex items-center mt-1">
            <div className="w-4 h-4 bg-gray-100 mr-2 rounded"></div>
            <span>Past days</span>
          </div>
        </div>
      </div>
  )
}
