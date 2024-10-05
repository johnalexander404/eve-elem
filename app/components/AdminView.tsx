'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '../auth-provider'
import { useAuth } from '../auth-provider'
import { useDate } from './DateProvider';
import { startOfMonth } from 'date-fns'

interface Entry {
  id: string
  date: string
  time: string
  username: string
}

export default function AdminView() {
  const [entries, setEntries] = useState<Entry[]>([])
  const {isAdmin } = useAuth()
  const { currentDate } = useDate();
  useEffect(() => {
    let unsubscribe = () => {}

    if (isAdmin) {
      console.log('fetching entries');
      // Set up real-time listener for Firestore
      const q = query(collection(db, 'entries'))

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedEntries: Entry[] = []
        setEntries([])
        querySnapshot.forEach((doc) => {
          fetchedEntries.push({ id: doc.id, ...doc.data() } as Entry)
        })
        fetchedEntries.map(entry => console.log(startOfMonth(entry.date), startOfMonth(currentDate)))
        const filteredEntries=fetchedEntries.filter(entry => startOfMonth(entry.date).getTime() === startOfMonth(currentDate).getTime() ).sort((a, b) => a.date.localeCompare(b.date))
        setEntries(filteredEntries)
      })
    }

    // Cleanup the listener when component unmounts or user changes
    return () => unsubscribe()
  }, [isAdmin, currentDate])

  if (!isAdmin) {
    return null
  }

  return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">All Entries</h2>
        <table className="w-full border-collapse border">
          <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Date</th>
            <th className="border p-2">Time</th>
            <th className="border p-2">Username</th>
          </tr>
          </thead>
          <tbody>
          {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="border p-2">{entry.date}</td>
                <td className="border p-2">{entry.time}</td>
                <td className="border p-2">{entry.username}</td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
  )
}
