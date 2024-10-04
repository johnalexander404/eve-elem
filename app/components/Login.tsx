'use client'

import { useState } from 'react'
import { useAuth } from '../auth-provider'
import PhoneLogin from './PhoneLogin'

export default function Login() {
  const { user, signInWithGoogle, signOut } = useAuth()
  const [showPhoneLogin, setShowPhoneLogin] = useState(false)

  if (user) {
    return (
      <div className="mb-4">
        <p className="mb-2">Welcome, {user.displayName || user.email || user.phoneNumber}</p>
        <button onClick={signOut} className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 space-y-4">
      <button 
        onClick={signInWithGoogle} 
        className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded flex items-center justify-center"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-6 h-6 mr-2" />
        Sign In with Google
      </button>
      <button 
        onClick={() => setShowPhoneLogin(!showPhoneLogin)} 
        className="w-full bg-green-500 text-white px-4 py-2 rounded"
      >
        {showPhoneLogin ? 'Hide Phone Login' : 'Sign In with Phone'}
      </button>
      {showPhoneLogin && <PhoneLogin />}
    </div>
  )
}