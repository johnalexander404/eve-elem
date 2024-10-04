import type { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { phoneNumber } = req.body

    try {
      const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verifications
        .create({ to: phoneNumber, channel: 'sms' })

      res.status(200).json({ success: true, verificationSid: verification.sid })
    } catch (error) {
      console.error('Error sending OTP:', error)
      res.status(500).json({ success: false, error: 'Failed to send OTP' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}