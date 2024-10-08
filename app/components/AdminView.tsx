'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../auth-provider'
import { useAuth } from '../auth-provider'
import { startOfMonth, endOfMonth, format } from 'date-fns'

interface Entry {
  id: string
  date: string
  time: string
  users: string[]
}

interface UserData {
  name: string
  email: string
  phoneNumber: string
}

export default function AdminView({ currentDate }: { currentDate: Date }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [userData, setUserData] = useState<{ [key: string]: UserData }>({})
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (user && isAdmin) {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      const q = query(
          collection(db, 'entries'),
          where('date', '>=', format(startDate, 'yyyy-MM-dd')),
          where('date', '<=', format(endDate, 'yyyy-MM-dd'))
      )

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedEntries: Entry[] = []
        querySnapshot.forEach((doc) => {
          fetchedEntries.push({ id: doc.id, ...doc.data() } as Entry)
        })
        setEntries(fetchedEntries)
      })

      return () => unsubscribe()
    }
  }, [user, isAdmin, currentDate])

  const fetchAllUserData = async () => {
    const userIds = new Set<string>()
    entries.forEach(entry => entry.users.forEach(userId => {
      if (userId) userIds.add(userId)
    }))

    const fetchedUserData: { [key: string]: UserData } = {}
    const userIdsArray = Array.from(userIds)
    for (let i = 0; i < userIdsArray.length; i++) {
      const userId = userIdsArray[i]
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        fetchedUserData[userId] = userDoc.data() as UserData
      }
    }
    setUserData(fetchedUserData)
  }

  useEffect(() => {
    if (entries.length > 0) {
      fetchAllUserData()
    }
  }, [entries, fetchAllUserData])


  if (!user || !isAdmin || !entries.length) {
    return null
  }

  return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">All Entries for {format(currentDate, 'MMMM yyyy')} (Admin View)</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Date</th>
              <th className="border p-2">Time</th>
              <th className="border p-2">Users</th>
            </tr>
            </thead>
            <tbody>
            {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="border p-2">{entry.date}</td>
                  <td className="border p-2">{entry.time}</td>
                  <td className="border p-2">
                    <ul>
                      {entry.users.map((userId, index) => (
                          <li key={index}>
                            {userId ? (
                                <>
                                  {userData[userId]?.name || 'Unknown'}
                                  {userData[userId]?.email && ` (${userData[userId].email})`}
                                </>
                            ) : (
                                'Empty slot'
                            )}
                          </li>
                      ))}
                    </ul>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
  )
}
