"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { events } from "@/data/events"
import type { SubscriptionFormData } from "@/types/notification"

// Adicionar um novo assinante com suas preferências de notificação
export async function subscribeToEvents(formData: SubscriptionFormData) {
  try {
    const supabase = createServerSupabaseClient()

    // Validar número de telefone
    let phoneNumber = formData.phone_number.trim()

    console.log("=== DETALHES DO NÚMERO DE TELEFONE ===")
    console.log("Número original:", phoneNumber)

    // Remover o prefixo whatsapp: se o usuário já o incluiu
    if (phoneNumber.startsWith("whatsapp:")) {
      phoneNumber = phoneNumber.substring(9)
      console.log("Número após remover prefixo whatsapp:", phoneNumber)
    }

    // Garantir que o número tenha o formato internacional com +
    if (!phoneNumber.startsWith("+")) {
      phoneNumber = "+" + phoneNumber
      console.log("Número após adicionar + (se necessário):", phoneNumber)
    }

    // Verificar se o número excede o limite de 20 caracteres
    if (phoneNumber.length > 20) {
      console.log("Número excede o limite de 20 caracteres:", phoneNumber.length)
      return {
        success: false,
        error: `Número de telefone muito longo (${phoneNumber.length} caracteres). O limite é de 20 caracteres.`,
      }
    }

    console.log("Número final a ser salvo:", phoneNumber)
    console.log("Tamanho do número:", phoneNumber.length)
    console.log("===========================================")

    // Validar o formato do número
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      return { success: false, error: "Número de telefone inválido. Use o formato internacional (ex: +5511999999999)" }
    }

    // Validar eventos selecionados
    if (!formData.event_ids || formData.event_ids.length === 0) {
      return { success: false, error: "Selecione pelo menos um evento para receber notificações" }
    }

    // Verificar se os IDs dos eventos são válidos
    const validEventIds = events.map((event) => event.id)
    const invalidEventIds = formData.event_ids.filter((id) => !validEventIds.includes(id))

    if (invalidEventIds.length > 0) {
      return { success: false, error: "Eventos inválidos selecionados" }
    }

    // Inserir o assinante com o número sem o prefixo whatsapp:
    const { data: subscriber, error: subscriberError } = await supabase
      .from("whatsapp_subscribers")
      .upsert(
        {
          phone_number: phoneNumber, // Salvar sem o prefixo whatsapp:
          name: formData.name || null,
          active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "phone_number",
          returning: "representation",
        },
      )
      .select()
      .single()

    if (subscriberError) {
      console.error("Erro ao adicionar assinante:", subscriberError)
      return { success: false, error: "Erro ao adicionar assinante: " + subscriberError.message }
    }

    // Remover notificações existentes para este assinante
    const { error: deleteError } = await supabase
      .from("event_notifications")
      .delete()
      .eq("subscriber_id", subscriber.id)

    if (deleteError) {
      console.error("Erro ao remover notificações existentes:", deleteError)
      return { success: false, error: "Erro ao atualizar preferências de notificação: " + deleteError.message }
    }

    // Adicionar as novas preferências de notificação
    const notificationData = formData.event_ids.map((eventId) => ({
      subscriber_id: subscriber.id,
      event_id: eventId,
    }))

    const { error: notificationError } = await supabase.from("event_notifications").insert(notificationData)

    if (notificationError) {
      console.error("Erro ao adicionar preferências de notificação:", notificationError)
      return { success: false, error: "Erro ao adicionar preferências de notificação: " + notificationError.message }
    }

    revalidatePath("/notifications")
    return { success: true, message: "Inscrição realizada com sucesso!" }
  } catch (error) {
    console.error("Erro ao processar inscrição:", error)
    return {
      success: false,
      error: `Erro ao processar inscrição: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// Obter todos os assinantes com suas preferências de notificação
export async function getSubscribers() {
  try {
    const supabase = createServerSupabaseClient()

    // Obter todos os assinantes
    const { data: subscribers, error: subscribersError } = await supabase
      .from("whatsapp_subscribers")
      .select("*")
      .order("created_at", { ascending: false })

    if (subscribersError) {
      console.error("Erro ao obter assinantes:", subscribersError)
      return {
        success: false,
        error: "Erro ao obter assinantes: " + subscribersError.message,
        subscribers: [],
      }
    }

    // Obter todas as notificações
    const { data: notifications, error: notificationsError } = await supabase.from("event_notifications").select("*")

    if (notificationsError) {
      console.error("Erro ao obter notificações:", notificationsError)
      return {
        success: false,
        error: "Erro ao obter notificações: " + notificationsError.message,
        subscribers: [],
      }
    }

    // Mapear as notificações para cada assinante
    const subscribersWithNotifications = subscribers.map((subscriber) => {
      const subscriberNotifications = notifications.filter((n) => n.subscriber_id === subscriber.id)
      return {
        ...subscriber,
        notifications: subscriberNotifications || [],
      }
    })

    return { success: true, subscribers: subscribersWithNotifications }
  } catch (error) {
    console.error("Erro ao obter assinantes:", error)
    return {
      success: false,
      error: `Erro ao obter assinantes: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      subscribers: [],
    }
  }
}

// Remover um assinante
export async function removeSubscriber(subscriberId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Primeiro remover as notificações associadas
    await supabase.from("event_notifications").delete().eq("subscriber_id", subscriberId)

    // Depois remover o assinante
    const { error } = await supabase.from("whatsapp_subscribers").delete().eq("id", subscriberId)

    if (error) {
      console.error("Erro ao remover assinante:", error)
      return { success: false, error: "Erro ao remover assinante: " + error.message }
    }

    revalidatePath("/notifications")
    return { success: true, message: "Assinante removido com sucesso!" }
  } catch (error) {
    console.error("Erro ao remover assinante:", error)
    return {
      success: false,
      error: `Erro ao remover assinante: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// Ativar/desativar um assinante
export async function toggleSubscriberStatus(subscriberId: string, active: boolean) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("whatsapp_subscribers")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", subscriberId)

    if (error) {
      console.error("Erro ao atualizar status do assinante:", error)
      return { success: false, error: "Erro ao atualizar status do assinante: " + error.message }
    }

    revalidatePath("/notifications")
    return { success: true, message: `Assinante ${active ? "ativado" : "desativado"} com sucesso!` }
  } catch (error) {
    console.error("Erro ao atualizar status do assinante:", error)
    return {
      success: false,
      error: `Erro ao atualizar status do assinante: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}
