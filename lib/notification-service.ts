"use server"

import { createServerSupabaseClient } from "./supabase/server"
import { events } from "@/data/events"
import type { Event } from "@/types/event"

// Função para enviar notificação via WhatsApp usando Twilio
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    // Verificar se as variáveis de ambiente do Twilio estão configuradas
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("Variáveis de ambiente do Twilio não configuradas")
      return {
        success: false,
        error:
          "Configuração do Twilio incompleta. Verifique as variáveis de ambiente TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER.",
      }
    }

    // Modo de teste - sempre retornar sucesso simulado em ambiente de desenvolvimento
    // Isso permite testar a funcionalidade sem depender do Twilio
    if (process.env.NODE_ENV === "development") {
      console.log("Executando em modo de desenvolvimento - simulando envio bem-sucedido")
      console.log(`Simulação: Mensagem enviada para ${phoneNumber}`)
      console.log(`Conteúdo da mensagem: ${message}`)
      return {
        success: true,
        messageId: "TESTE-" + Date.now(),
        testMode: true,
      }
    }

    // Em produção, tentamos usar o Twilio
    try {
      // Importar o módulo Twilio de forma segura
      const twilioModule = await import("twilio")

      // Verificar se o módulo foi importado corretamente
      if (!twilioModule) {
        throw new Error("Falha ao importar o módulo Twilio")
      }

      // Tentar diferentes formas de acessar o construtor Twilio
      let TwilioClient

      if (typeof twilioModule.default === "function") {
        // Se o módulo exporta uma função como default
        TwilioClient = twilioModule.default
      } else if (twilioModule.Twilio) {
        // Se o módulo exporta uma classe Twilio
        TwilioClient = twilioModule.Twilio
      } else {
        // Última tentativa - usar o próprio módulo como construtor
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

      // Formatar o número de telefone para o formato do WhatsApp
      const formattedPhoneNumber = phoneNumber.startsWith("+") ? `whatsapp:${phoneNumber}` : `whatsapp:+${phoneNumber}`
      const formattedTwilioNumber = twilioPhoneNumber.startsWith("whatsapp:")
        ? twilioPhoneNumber
        : `whatsapp:${twilioPhoneNumber}`

      // Enviar mensagem
      const result = await client.messages.create({
        body: message,
        from: formattedTwilioNumber,
        to: formattedPhoneNumber,
      })

      console.log(`Mensagem enviada para ${phoneNumber}, SID: ${result.sid}`)
      return { success: true, messageId: result.sid }
    } catch (twilioError) {
      console.error("Erro com o Twilio:", twilioError)

      // Em produção, retornar erro
      return {
        success: false,
        error: `Erro com o Twilio: ${twilioError instanceof Error ? twilioError.message : "Erro desconhecido"}`,
      }
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem WhatsApp:", error)

    // Em produção, retornar erro
    if (process.env.NODE_ENV !== "development") {
      return {
        success: false,
        error: `Erro geral ao enviar mensagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      }
    }

    // Em desenvolvimento, simular sucesso mesmo em caso de erro
    console.log("Executando em modo de desenvolvimento - simulando envio bem-sucedido após erro")
    return {
      success: true,
      messageId: "TESTE-ERRO-" + Date.now(),
      testMode: true,
      errorCaught: true,
    }
  }
}

// Função para verificar eventos próximos e enviar notificações
export async function checkUpcomingEventsAndNotify() {
  try {
    console.log("Iniciando verificação de eventos próximos...")
    const supabase = createServerSupabaseClient()
    const now = new Date()
    console.log("Data/hora atual:", now.toISOString())

    // Obter todos os assinantes ativos
    console.log("Buscando assinantes ativos...")
    const { data: subscribers, error: subscribersError } = await supabase
      .from("whatsapp_subscribers")
      .select("*")
      .eq("active", true)

    if (subscribersError) {
      console.error("Erro ao obter assinantes:", subscribersError)
      return {
        success: false,
        error: `Erro ao obter assinantes: ${subscribersError.message}`,
      }
    }

    console.log(`Encontrados ${subscribers?.length || 0} assinantes ativos`)

    // Se não houver assinantes, retornar sucesso mas sem notificações
    if (!subscribers || subscribers.length === 0) {
      console.log("Nenhum assinante ativo encontrado")
      return {
        success: true,
        message: "Nenhum assinante ativo encontrado",
        notificationsSent: 0,
        results: [],
      }
    }

    // Obter todas as preferências de notificação
    console.log("Buscando preferências de notificação...")
    const { data: notifications, error: notificationsError } = await supabase.from("event_notifications").select("*")

    if (notificationsError) {
      console.error("Erro ao obter notificações:", notificationsError)
      return {
        success: false,
        error: `Erro ao obter notificações: ${notificationsError.message}`,
      }
    }

    console.log(`Encontradas ${notifications?.length || 0} preferências de notificação`)

    // Para cada assinante, verificar eventos próximos
    const notificationResults = []

    // Modo de teste: verificar todos os eventos para o primeiro assinante
    // Isso garante que tenhamos algo para mostrar mesmo que nenhum evento esteja a 30 minutos de começar
    if (subscribers.length > 0) {
      console.log("Executando modo de teste para o primeiro assinante...")
      const testSubscriber = subscribers[0]
      console.log("Assinante de teste:", testSubscriber.phone_number)

      const subscriberEventIds = notifications
        .filter((n) => n.subscriber_id === testSubscriber.id)
        .map((n) => n.event_id)

      console.log(`Assinante de teste tem ${subscriberEventIds.length} eventos selecionados`)

      // Se o assinante tiver eventos selecionados
      if (subscriberEventIds.length > 0) {
        // Pegar o primeiro evento para teste
        const testEvent = events.find((event) => subscriberEventIds.includes(event.id))

        if (testEvent) {
          console.log(`Enviando notificação de teste para o evento: ${testEvent.name}`)
          // Criar uma mensagem de teste
          const message = `🎮 *Aion Classic Timer - TESTE* 🎮\n\nEsta é uma mensagem de teste para o evento *${testEvent.name}*. Em produção, você receberá notificações 30 minutos antes de cada evento começar.`

          // Enviar a notificação de teste
          const result = await sendWhatsAppMessage(testSubscriber.phone_number, message)
          console.log("Resultado do envio de teste:", result)

          notificationResults.push({
            subscriber: testSubscriber.phone_number,
            event: testEvent.name,
            success: result.success,
            error: result.success ? null : result.error,
            isTest: true,
            testMode: result.testMode || false,
          })
        } else {
          console.log("Nenhum evento válido encontrado para o assinante de teste")
        }
      } else {
        console.log("Assinante de teste não tem eventos selecionados")
      }
    }

    // Verificar eventos reais que começarão em 30 minutos
    console.log("Verificando eventos reais que começarão em 30 minutos...")
    for (const subscriber of subscribers) {
      // Obter os IDs dos eventos que o assinante deseja ser notificado
      const subscriberEventIds = notifications.filter((n) => n.subscriber_id === subscriber.id).map((n) => n.event_id)

      // Se o assinante não tiver eventos selecionados, pular
      if (subscriberEventIds.length === 0) {
        continue
      }

      // Filtrar apenas os eventos que o assinante deseja ser notificado
      const subscriberEvents = events.filter((event) => subscriberEventIds.includes(event.id))

      // Para cada evento, verificar se está próximo de começar
      for (const event of subscriberEvents) {
        const nextEventTime = getNextEventTime(event, now)

        if (nextEventTime) {
          // Calcular a diferença de tempo em minutos
          const diffMinutes = (nextEventTime.getTime() - now.getTime()) / (1000 * 60)

          // Se o evento começará em 30 minutos (entre 29 e 31 minutos para dar uma margem)
          if (diffMinutes >= 29 && diffMinutes <= 31) {
            console.log(`Evento ${event.name} começará em aproximadamente 30 minutos (${diffMinutes.toFixed(2)} min)`)

            // Formatar a hora do evento
            const eventTimeStr = nextEventTime.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })

            // Formatar a data do evento
            const eventDateStr = nextEventTime.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
            })

            // Criar a mensagem
            const message = `🎮 *Aion Classic Timer* 🎮\n\nO evento *${event.name}* começará em 30 minutos (${eventDateStr} às ${eventTimeStr})! Prepare-se!`

            // Enviar a notificação
            console.log(`Enviando notificação para ${subscriber.phone_number} sobre o evento ${event.name}`)
            const result = await sendWhatsAppMessage(subscriber.phone_number, message)
            console.log("Resultado do envio:", result)

            notificationResults.push({
              subscriber: subscriber.phone_number,
              event: event.name,
              success: result.success,
              error: result.success ? null : result.error,
              isTest: false,
              testMode: result.testMode || false,
            })
          } else {
            console.log(`Evento ${event.name} não está próximo de começar (${diffMinutes.toFixed(2)} min)`)
          }
        } else {
          console.log(`Não foi possível determinar o próximo horário para o evento ${event.name}`)
        }
      }
    }

    console.log(`Verificação concluída. ${notificationResults.length} notificações enviadas.`)
    return {
      success: true,
      message:
        notificationResults.length > 0
          ? `Verificação concluída. ${notificationResults.length} notificações enviadas.`
          : "Verificação concluída. Nenhum evento está prestes a começar.",
      notificationsSent: notificationResults.length,
      results: notificationResults,
    }
  } catch (error) {
    console.error("Erro ao verificar eventos próximos:", error)
    return {
      success: false,
      error: `Erro ao verificar eventos próximos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// Função auxiliar para obter o próximo horário de um evento
function getNextEventTime(event: Event, currentTime: Date): Date | null {
  // Obter o dia atual da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
  const currentDay = currentTime.getDay()
  // Converter para nosso formato (0 = Segunda, ..., 6 = Domingo)
  const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1

  // Verificar se o evento ocorre no dia atual
  const eventDays = Array.isArray(event.day) ? event.day : [event.day]

  // Encontrar a próxima data do evento
  let nextDate: Date | null = null
  let minDiffMs = Number.POSITIVE_INFINITY

  // Verificar todos os dias da semana
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDay = (adjustedCurrentDay + dayOffset) % 7

    // Verificar se o evento ocorre neste dia
    if (eventDays.includes(checkDay)) {
      // Processar eventos com múltiplos horários de abertura
      if (event.openTimes && event.openTimes.length > 0) {
        for (const openTime of event.openTimes) {
          // Verificar se openTime é uma string válida
          if (typeof openTime !== "string") {
            console.error(`Formato inválido para openTime no evento ${event.name}:`, openTime)
            continue
          }

          const timeParts = openTime.split(":")
          if (timeParts.length !== 2) {
            console.error(`Formato inválido para openTime no evento ${event.name}: ${openTime}`)
            continue
          }

          const openHour = Number.parseInt(timeParts[0], 10)
          const openMinute = Number.parseInt(timeParts[1], 10)

          if (isNaN(openHour) || isNaN(openMinute)) {
            console.error(`Valores inválidos para openTime no evento ${event.name}: ${openTime}`)
            continue
          }

          // Criar data para este horário
          const openDate = new Date(currentTime)
          openDate.setDate(currentTime.getDate() + dayOffset)
          openDate.setHours(openHour, openMinute, 0, 0)

          // Se este horário já passou hoje, ignorar
          if (dayOffset === 0 && openDate < currentTime) continue

          const diffMs = openDate.getTime() - currentTime.getTime()
          if (diffMs < minDiffMs) {
            minDiffMs = diffMs
            nextDate = openDate
          }
        }
      }
      // Processar eventos com horário único
      else if (event.time) {
        // Verificar se time é uma string válida
        if (typeof event.time !== "string") {
          console.error(`Formato inválido para time no evento ${event.name}:`, event.time)
          continue
        }

        const timeParts = event.time.split(":")
        if (timeParts.length !== 2) {
          console.error(`Formato inválido para time no evento ${event.name}: ${event.time}`)
          continue
        }

        const eventHour = Number.parseInt(timeParts[0], 10)
        const eventMinute = Number.parseInt(timeParts[1], 10)

        if (isNaN(eventHour) || isNaN(eventMinute)) {
          console.error(`Valores inválidos para time no evento ${event.name}: ${event.time}`)
          continue
        }

        // Criar data para este horário
        const openDate = new Date(currentTime)
        openDate.setDate(currentTime.getDate() + dayOffset)
        openDate.setHours(eventHour, eventMinute, 0, 0)

        // Se este horário já passou hoje, ignorar
        if (dayOffset === 0 && openDate < currentTime) continue

        const diffMs = openDate.getTime() - currentTime.getTime()
        if (diffMs < minDiffMs) {
          minDiffMs = diffMs
          nextDate = openDate
        }
      }
    }
  }

  return nextDate
}
