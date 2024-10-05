 'use client'
import Login from './components/Login'
import Calendar from './components/Calendar'
import AdminView from './components/AdminView'
import {DateProvider} from './components/DateProvider'

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Volunteer Signup</h1>
      <Login />
       <DateProvider>
           <Calendar />
           <AdminView />
       </DateProvider>
    </div>
  )
}
