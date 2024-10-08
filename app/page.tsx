'use client'

 import { useState } from 'react'
 import { useAuth } from './auth-provider'
 import Login from './components/Login'
 import Calendar from './components/Calendar'
 import AdminView from './components/AdminView'

 export default function Home() {
     const { isAdmin } = useAuth()
     const [currentDate, setCurrentDate] = useState(new Date())

     return (
         <main className="container mx-auto px-4 py-8">
             <h1 className="text-4xl font-bold mb-8">Volunteer Signup</h1>
             <Login />
                 <Calendar currentDate={currentDate} setCurrentDate={setCurrentDate} />
                 {isAdmin && <AdminView currentDate={currentDate} />}
         </main>
     )
 }

