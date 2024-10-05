'use client'

import { useState, useEffect } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '../auth-provider'
import { useAuth } from '../auth-provider'

interface Entry {
  id: string
  date: string
  time: string
  username: string
}

export default function AdminView() {
  const [entries, setEntries] = useState<Entry[]>([])
  const {isAdmin } = useAuth()

  useEffect(() => {
    let unsubscribe = () => {}

    if (isAdmin) {
      console.log('fetching entries');
      // Set up real-time listener for Firestore
      const q = query(collection(db, 'entries'))

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedEntries: Entry[] = []
        querySnapshot.forEach((doc) => {
          fetchedEntries.push({ id: doc.id, ...doc.data() } as Entry)
        })
        setEntries(fetchedEntries)
      })
    }

    // Cleanup the listener when component unmounts or user changes
    return () => unsubscribe()
  }, [isAdmin])

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
