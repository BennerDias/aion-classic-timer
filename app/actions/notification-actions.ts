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
    const phoneNumber = formData.phone_number.trim()
    if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
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

    // Inserir o assinante
    const { data: subscriber, error: subscriberError } = await supabase
      .from("whatsapp_subscribers")
      .upsert(
        {
          phone_number: phoneNumber,
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
      return { success: false, error: "Erro ao adicionar assinante" }
    }

    // Remover notificações existentes para este assinante
    await supabase.from("event_notifications").delete().eq("subscriber_id", subscriber.id)

    // Adicionar as novas preferências de notificação
    const notificationData = formData.event_ids.map((eventId) => ({
      subscriber_id: subscriber.id,
      event_id: eventId,
    }))

    const { error: notificationError } = await supabase.from("event_notifications").insert(notificationData)

    if (notificationError) {
      console.error("Erro ao adicionar preferências de notificação:", notificationError)
      return { success: false, error: "Erro ao adicionar preferências de notificação" }
    }

    revalidatePath("/")
    return { success: true, message: "Inscrição realizada com sucesso!" }
  } catch (error) {
    console.error("Erro ao processar inscrição:", error)
    return { success: false, error: "Erro ao processar inscrição" }
  }
}

// Obter todos os assinantes com suas preferências de notificação
export async function getSubscribers() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: subscribers, error: subscribersError } = await supabase
      .from("whatsapp_subscribers")
      .select("*")
      .order("created_at", { ascending: false })

    if (subscribersError) {
      console.error("Erro ao obter assinantes:", subscribersError)
      return { success: false, error: "Erro ao obter assinantes", subscribers: [] }
    }

    const { data: notifications, error: notificationsError } = await supabase.from("event_notifications").select("*")

    if (notificationsError) {
      console.error("Erro ao obter notificações:", notificationsError)
      return { success: false, error: "Erro ao obter notificações", subscribers: [] }
    }

    // Mapear as notificações para cada assinante
    const subscribersWithNotifications = subscribers.map((subscriber) => {
      const subscriberNotifications = notifications.filter((n) => n.subscriber_id === subscriber.id)
      return {
        ...subscriber,
        notifications: subscriberNotifications,
      }
    })

    return { success: true, subscribers: subscribersWithNotifications }
  } catch (error) {
    console.error("Erro ao obter assinantes:", error)
    return { success: false, error: "Erro ao obter assinantes", subscribers: [] }
  }
}

// Remover um assinante
export async function removeSubscriber(subscriberId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("whatsapp_subscribers").delete().eq("id", subscriberId)

    if (error) {
      console.error("Erro ao remover assinante:", error)
      return { success: false, error: "Erro ao remover assinante" }
    }

    revalidatePath("/")
    return { success: true, message: "Assinante removido com sucesso!" }
  } catch (error) {
    console.error("Erro ao remover assinante:", error)
    return { success: false, error: "Erro ao remover assinante" }
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
      return { success: false, error: "Erro ao atualizar status do assinante" }
    }

    revalidatePath("/")
    return { success: true, message: `Assinante ${active ? "ativado" : "desativado"} com sucesso!` }
  } catch (error) {
    console.error("Erro ao atualizar status do assinante:", error)
    return { success: false, error: "Erro ao atualizar status do assinante" }
  }
}
