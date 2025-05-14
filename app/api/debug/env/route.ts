import { NextResponse } from "next/server"

export const dynamic = "force-dynamic" // Desativar cache para esta rota

export async function GET() {
  try {
    // Obter variáveis de ambiente relacionadas ao Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || ""
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || ""
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || ""

    // Verificar se as variáveis estão definidas
    const hasTwilioAccountSid = !!twilioAccountSid
    const hasTwilioAuthToken = !!twilioAuthToken
    const hasTwilioPhoneNumber = !!twilioPhoneNumber

    return NextResponse.json({
      success: true,
      env: {
        TWILIO_ACCOUNT_SID: hasTwilioAccountSid ? twilioAccountSid : "",
        TWILIO_AUTH_TOKEN: hasTwilioAuthToken,
        TWILIO_PHONE_NUMBER: hasTwilioPhoneNumber ? twilioPhoneNumber : "",
      },
      status: {
        hasTwilioAccountSid,
        hasTwilioAuthToken,
        hasTwilioPhoneNumber,
        isConfigComplete: hasTwilioAccountSid && hasTwilioAuthToken && hasTwilioPhoneNumber,
      },
    })
  } catch (error) {
    console.error("Erro ao obter variáveis de ambiente:", error)
    return NextResponse.json({
      success: false,
      error: "Erro ao obter variáveis de ambiente",
    })
  }
}
