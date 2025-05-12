export type EventStatus = "active" | "future" | "closed"

export interface Event {
  id: string
  name: string
  day: number | number[] // Pode ser um único dia ou array de dias
  time?: string // Horário único (mantido para compatibilidade)
  openTimes?: string[] // Múltiplos horários de abertura (ex: ["09:00", "15:00", "21:00"])
  duration?: number // Duração em minutos que o evento permanece aberto
  image?: string // Caminho para a imagem do evento
  status: EventStatus
}
