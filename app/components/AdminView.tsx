'use client'

import { useState, useEffect } from 'react'
import { collection, query, getDocs } from 'firebase/firestore'
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
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchAllEntries()
    }
  }, [entries])

  const fetchAllEntries = async () => {
    console.log('fetching entries from admin')
    const q = query(collection(db, 'entries'))
    const querySnapshot = await getDocs(q)
    const fetchedEntries: Entry[] = []
    querySnapshot.forEach((doc) => {
      fetchedEntries.push({ id: doc.id, ...doc.data() } as Entry)
    })
    setEntries(fetchedEntries)
  }

  if (!user) {
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
