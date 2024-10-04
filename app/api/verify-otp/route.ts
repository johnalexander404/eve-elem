import twilio from 'twilio'
import {NextRequest, NextResponse} from "next/server";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

interface PhoneVerificationRequestBody {
    phoneNumber: string
    code: string
}
export async function POST(req: NextRequest) {

  const body: PhoneVerificationRequestBody = await req.json();
  let { phoneNumber } = body
  const { code } = body


  if (!phoneNumber.startsWith('+1')) {
    phoneNumber = '+1' + phoneNumber
  }
  try {
    const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks
        .create({ to: phoneNumber, code: code })
    return NextResponse.json({ success: verification.status, verificationSid: verification.sid })
  } catch (error) {
      console.error('Error sending OTP:', error)
      return NextResponse.json(
          { message: 'Failed to send OTP' },
          { status: 500 }
      );
    }
}
