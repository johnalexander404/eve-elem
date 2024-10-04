'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../auth-provider'
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isSameMonth, isWeekend } from 'date-fns'

const db = getFirestore()

interface Entry {
  id: string
  date: string
  time: string
  username: string
}

const timeSlots = ['8:00 AM - 9:00 AM', '2:15 PM - 3:15 PM']

// US Public Holidays (2023, 2024, and 2025)
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

export default function Calendar() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [user, currentDate])

  const fetchEntries = async () => {
    console.log('fetching entries')
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    const q = query(
      collection(db, 'entries'),
      where('date', '>=', format(startDate, 'yyyy-MM-dd')),
      where('date', '<=', format(endDate, 'yyyy-MM-dd'))
    )
    const querySnapshot = await getDocs(q)
    const fetchedEntries: Entry[] = []
    querySnapshot.forEach((doc) => {
      fetchedEntries.push({ id: doc.id, ...doc.data() } as Entry)
    })
    setEntries(fetchedEntries)
  }

  const handleEntryClick = async (date: Date, time: string) => {
    if (!user || isWeekend(date) || isHoliday(date)) return

    const dateString = format(date, 'yyyy-MM-dd')
    const existingEntry = entries.find(entry => entry.date === dateString && entry.time === time)

    if (existingEntry) {
      if (existingEntry.username == (user.email || user.phoneNumber)) {
        if (confirm('Are you sure you want to remove your entry?')) {
          await deleteDoc(doc(db, 'entries', existingEntry.id))
        }
      } else {
        alert(`this slot is taken by ${existingEntry.username}`)
      }
    } else {
      if (confirm('Are you sure you want to sign up for this slot?')) {
        await addDoc(collection(db, 'entries'), {
          date: dateString,
          time,
          username: user.email || user.phoneNumber
        });
      }
    }

    fetchEntries()
  }

  const renderTimeSlot = (date: Date, time: string) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const entry = entries.find(e => e.date === dateString && e.time === time)
    const isUserEntry = entry && entry.username === (user?.email || user?.phoneNumber)
    const isTaken = !!entry
    const isDisabled = isWeekend(date) || isHoliday(date)

    return (
      <div
        key={`${dateString}-${time}`}
        className={`h-2 w-full ${isDisabled ? 'bg-gray-300 cursor-not-allowed' : isTaken ? 'bg-red-500' : 'bg-green-500 cursor-pointer'} ${isUserEntry ? 'opacity-50' : ''}`}
        onClick={() => !isDisabled && handleEntryClick(date, time)}
        role={isDisabled ? 'presentation' : 'button'}
        aria-disabled={isDisabled}
      >
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
          isCurrentDay ? 'bg-blue-100' : ''
        } ${isDisabled ? 'bg-gray-200' : ''}`}
      >
        <div className="text-xs mb-1">{dayString}</div>
        <div className="space-y-1">
          {timeSlots.map(time => renderTimeSlot(date, time))}
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
          onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Previous Month
        </button>
        <h3 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
        <button
          onClick={() => setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
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
          <div className="w-4 h-4 bg-green-500 mr-2"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center mt-1">
          <div className="w-4 h-4 bg-red-500 mr-2"></div>
          <span>Taken</span>
        </div>
        <div className="flex items-center mt-1">
          <div className="w-4 h-4 bg-gray-300 mr-2"></div>
          <span>Weekend/Holiday (Not Available)</span>
        </div>
      </div>
    </div>
  )
}
