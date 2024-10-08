'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../auth-provider'
import { getFirestore, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isSameMonth, isWeekend } from 'date-fns'

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
  '2024-09-02', '2024-10-14', '2024-11-11', '2024-11-28', '2024-12-25',
  // 2025 Holidays
  '2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26', '2025-07-04',
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
  const [users, setUsers] = useState< UserData[] >([])

  useEffect(() => {
    if (user) {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      const q = query(
          collection(db, 'entries'),
          where('date', '>=', format(startDate, 'yyyy-MM-dd')),
          where('date', '<=', format(endDate, 'yyyy-MM-dd'))
      )

      const uq = query(collection(db, 'users'))
      const unsubscibeUsers = onSnapshot(uq, (querySnapshot) => {
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
        unsubscibeUsers()
      }
    }
  }, [user, currentDate])

  const handleEntryClick = async (date: Date, time: string, slotIndex: number) => {
    if (!user || isWeekend(date) || isHoliday(date)) return

    const dateString = format(date, 'yyyy-MM-dd')
    const existingEntry = entries.find(entry => entry.date === dateString && entry.time === time)

    if (existingEntry) {
      const updatedUsers = [...existingEntry.users]
      if (updatedUsers[slotIndex] === user.uid) {
        // Remove user from the slot
        if (confirm('Are you sure you want to remove your entry?')) {
          updatedUsers[slotIndex] = ''
          if (updatedUsers.every(u => u === '')) {
            await deleteDoc(doc(db, 'entries', existingEntry.id))
          } else {
            await updateDoc(doc(db, 'entries', existingEntry.id), { users: updatedUsers })
          }
        }
      } else if (updatedUsers[slotIndex] === '') {
        // Add user to the slot
        if (confirm('Are you sure you want to sign up for this slot?')) {
          updatedUsers[slotIndex] = user.uid
          await updateDoc(doc(db, 'entries', existingEntry.id), { users: updatedUsers })
        }
      } else {
        if (isAdmin) {
            const user = users.find(u => u.id === updatedUsers[slotIndex])
            if (confirm(`This slot is already taken by ${user?.name} . Do you want to remove it?`)){
              updatedUsers[slotIndex] = ''
              if (updatedUsers.every(u => u === '')) {
                await deleteDoc(doc(db, 'entries', existingEntry.id))
              } else {
                await updateDoc(doc(db, 'entries', existingEntry.id), {users: updatedUsers})
              }
            }
        } else {
          alert(`This slot is already taken by ${updatedUsers[slotIndex]}`)
        }
      }
    } else {
      // Create a new entry
      if (confirm('Are you sure you want to sign up for this slot?')) {
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

    return (
        <div
            key={date.toString()}
            className={`border p-1 ${isCurrentMonth ? '' : 'bg-gray-100'} ${
                isCurrentDay ? 'bg-yellow-900' : ''
            } ${isDisabled ? 'bg-gray-200' : ''}`}
        >
          <div className={`text-xs mb-1 ${isDisabled ? 'text-gray-500' : ''}`}>{dayString}</div>
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
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold">
                {day}
              </div>
          ))}
          {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="border p-1"></div>
          ))}
          {daysInMonth.map(renderDay)}
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
        </div>
      </div>
  )
}
