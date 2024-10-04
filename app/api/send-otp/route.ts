import twilio from 'twilio'
import {NextRequest, NextResponse} from "next/server";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

interface PhoneRequestBody {
    phoneNumber: string
}
export async function POST(req: NextRequest) {

  const body: PhoneRequestBody = await req.json();
  let { phoneNumber } = body

  if (!phoneNumber) {
    return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
    );
  }
  if (!phoneNumber.startsWith('+1')) {
      phoneNumber = '+1' + phoneNumber
  }
  try {
    const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' })

    return NextResponse.json({ success: true, verificationSid: verification.sid })
  } catch (error) {
      console.error('Error sending OTP:', error)
      return NextResponse.json(
          { message: 'Failed to send OTP' },
          { status: 500 }
      );
    }
}
