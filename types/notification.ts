export interface WhatsAppSubscriber {
  id: string
  phone_number: string
  name: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface EventNotification {
  id: string
  subscriber_id: string
  event_id: string
  created_at: string
}

export interface SubscriptionFormData {
  name: string
  phone_number: string
  event_ids: string[]
}
