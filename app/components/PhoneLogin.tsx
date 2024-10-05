'use client'

import { useState } from 'react'

export default function PhoneLogin() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [otp, setOtp] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      const data = await response.json()
      if (data.success) {
        setVerificationId(data.verificationSid)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otp})
      })
      const data = await response.json()
      if (data.success) {
        setVerificationId(data.verificationSid)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
    }
  }

  return (
    <div className="mt-4">
      {!verificationId ? (
        <form onSubmit={handleSendOtp} className="space-y-2">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
            className="w-full p-2 border rounded"
            required
          />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Send OTP
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-2">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full p-2 border rounded"
            required
          />
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
            Verify OTP
          </button>
        </form>
      )}
    </div>
  )
}
