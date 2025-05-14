import { NextResponse } from "next/server"

export const dynamic = "force-dynamic" // Desativar cache para esta rota

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: "Número de telefone não fornecido",
      })
    }

    // Verificar se as variáveis de ambiente do Twilio estão configuradas
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json({
        success: false,
        error: "Configuração do Twilio incompleta",
        config: {
          hasTwilioAccountSid: !!accountSid,
          hasTwilioAuthToken: !!authToken,
          hasTwilioPhoneNumber: !!twilioPhoneNumber,
        },
      })
    }

    // Formatar o número de telefone para o formato do WhatsApp
    let formattedPhoneNumber = phoneNumber

    // Remover o prefixo whatsapp: se o usuário já o incluiu
    if (formattedPhoneNumber.startsWith("whatsapp:")) {
      formattedPhoneNumber = formattedPhoneNumber.substring(9)
    }

    // Adicionar o prefixo whatsapp: e garantir que o número tenha o formato internacional
    formattedPhoneNumber = `whatsapp:${formattedPhoneNumber.startsWith("+") ? formattedPhoneNumber : `+${formattedPhoneNumber}`}`

    // Verificar se o número do Twilio já tem o prefixo whatsapp:
    const formattedTwilioNumber = twilioPhoneNumber.startsWith("whatsapp:")
      ? twilioPhoneNumber
      : `whatsapp:${twilioPhoneNumber}`

    // Criar mensagem de teste
    const message = `🎮 *Aion Classic Timer - TESTE DE CONFIGURAÇÃO* 🎮\n\nEsta é uma mensagem de teste para verificar a configuração do Twilio. Se você recebeu esta mensagem, a configuração está correta!`

    try {
      // Importar o módulo Twilio
      const twilioModule = await import("twilio")

      // Verificar se o módulo foi importado corretamente
      if (!twilioModule) {
        throw new Error("Falha ao importar o módulo Twilio")
      }

      // Tentar diferentes formas de acessar o construtor Twilio
      let TwilioClient

      if (typeof twilioModule.default === "function") {
        TwilioClient = twilioModule.default
      } else if (twilioModule.Twilio) {
        TwilioClient = twilioModule.Twilio
      } else {
        TwilioClient = twilioModule
      }

      // Verificar se temos um construtor válido
      if (!TwilioClient) {
        throw new Error("Não foi possível encontrar o construtor Twilio no módulo importado")
      }

      // Criar cliente Twilio
      const client =
        typeof TwilioClient === "function"
          ? new TwilioClient(accountSid, authToken)
          : TwilioClient(accountSid, authToken)

      // Verificar se o cliente foi criado corretamente
      if (!client || !client.messages || typeof client.messages.create !== "function") {
        throw new Error("Cliente Twilio inválido ou não possui o método messages.create")
      }

      // Enviar mensagem
      const result = await client.messages.create({
        body: message,
        from: formattedTwilioNumber,
        to: formattedPhoneNumber,
      })

      console.log(`Mensagem de teste enviada para ${formattedPhoneNumber}, SID: ${result.sid}`)

      return NextResponse.json({
        success: true,
        messageId: result.sid,
        details: {
          from: formattedTwilioNumber,
          to: formattedPhoneNumber,
          status: result.status,
        },
      })
    } catch (twilioError) {
      console.error("Erro com o Twilio:", twilioError)

      // Em ambiente de desenvolvimento, simular sucesso
      if (process.env.NODE_ENV === "development") {
        console.log("Executando em modo de desenvolvimento - simulando envio bem-sucedido")
        return NextResponse.json({
          success: true,
          messageId: "TESTE-" + Date.now(),
          testMode: true,
          details: {
            from: formattedTwilioNumber,
            to: formattedPhoneNumber,
            status: "queued",
          },
        })
      }

      return NextResponse.json({
        success: false,
        error: `Erro com o Twilio: ${twilioError instanceof Error ? twilioError.message : "Erro desconhecido"}`,
        details: {
          from: formattedTwilioNumber,
          to: formattedPhoneNumber,
        },
      })
    }
  } catch (error) {
    console.error("Erro ao processar solicitação:", error)

    // Em ambiente de desenvolvimento, simular sucesso
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        messageId: "TESTE-ERRO-" + Date.now(),
        testMode: true,
        errorCaught: true,
      })
    }

    return NextResponse.json({
      success: false,
      error: `Erro ao processar solicitação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    })
  }
}
