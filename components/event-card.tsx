"use client"

import { useState, useEffect } from "react"
import type { Event } from "@/types/event"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface EventCardProps {
  event: Event
  currentTime: Date
}

export function EventCard({ event, currentTime }: EventCardProps) {
  const [timeRemaining, setTimeRemaining] = useState("")
  const [statusText, setStatusText] = useState("")
  const [statusClass, setStatusClass] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [nextTime, setNextTime] = useState("")
  const [nextEventDate, setNextEventDate] = useState<Date | null>(null)
  const [nextCloseDate, setNextCloseDate] = useState<Date | null>(null)

  // Efeito para calcular o status inicial do evento
  useEffect(() => {
    calculateInitialStatus()
  }, [event])

  // Efeito para atualizar o tempo restante a cada segundo
  useEffect(() => {
    updateTimeRemaining()
  }, [currentTime, nextEventDate, nextCloseDate])

  // Função para calcular o status inicial do evento e definir as próximas datas importantes
  function calculateInitialStatus() {
    // Obter o dia atual da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const currentDay = currentTime.getDay()
    // Converter para nosso formato (0 = Segunda, ..., 6 = Domingo)
    const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1

    // Verificar se o evento ocorre no dia atual
    const eventDays = Array.isArray(event.day) ? event.day : [event.day]
    const isEventDay = eventDays.includes(adjustedCurrentDay)

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
            const [openHour, openMinute] = openTime.split(":").map(Number)

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
          const [eventHour, eventMinute] = event.time.split(":").map(Number)

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

        // Se encontramos uma data para hoje, verificar se o evento está aberto agora
        if (dayOffset === 0 && nextDate) {
          // Verificar se o evento está aberto agora
          const closeDate = new Date(nextDate)
          closeDate.setMinutes(closeDate.getMinutes() + (event.duration || 60))

          if (currentTime >= nextDate && currentTime < closeDate) {
            setIsOpen(true)
            setNextCloseDate(closeDate)
            setStatusClass("bg-[#33ff33]") // Verde brilhante para aberto

            // Formatar horário de fechamento
            setNextTime(
              `${closeDate.getHours().toString().padStart(2, "0")}:${closeDate.getMinutes().toString().padStart(2, "0")}`,
            )
            return
          }
        }
      }
    }

    // Se chegamos aqui, o evento não está aberto
    if (nextDate) {
      setNextEventDate(nextDate)
      setIsOpen(false)
      setStatusClass("bg-red-600") // Vermelho para fechado

      // Formatar horário de abertura
      setNextTime(
        `${nextDate.getHours().toString().padStart(2, "0")}:${nextDate.getMinutes().toString().padStart(2, "0")}`,
      )

      // Determinar o dia da semana
      const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
      const nextDay = nextDate.getDay() === 0 ? 6 : nextDate.getDay() - 1
      setStatusText(`Próximo em ${dayNames[nextDay]}`)
    } else {
      // Fallback para eventos sem horário definido
      setTimeRemaining("--:--")
      setStatusText("Horário não disponível")
      setStatusClass("bg-gray-800")
      setIsOpen(false)
      setNextTime("")
    }
  }

  // Função para atualizar o tempo restante a cada segundo
  function updateTimeRemaining() {
    if (isOpen && nextCloseDate) {
      // Evento está aberto, calcular tempo até fechar
      const diffMs = nextCloseDate.getTime() - currentTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)

      if (diffSeconds <= 0) {
        // O evento acabou de fechar, recalcular o status
        calculateInitialStatus()
        return
      }

      const diffHours = Math.floor(diffSeconds / 3600)
      const diffMinutes = Math.floor((diffSeconds % 3600) / 60)
      const remainingSeconds = diffSeconds % 60

      // Formatar tempo restante
      const formattedTime =
        diffHours > 0
          ? `${diffHours}:${diffMinutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
          : `${diffMinutes}:${remainingSeconds.toString().padStart(2, "0")}`

      setTimeRemaining(formattedTime)
      setStatusText(
        `Fecha em ${diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m ${remainingSeconds}s`}`,
      )
    } else if (!isOpen && nextEventDate) {
      // Evento está fechado, calcular tempo até abrir
      const diffMs = nextEventDate.getTime() - currentTime.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)

      if (diffSeconds <= 0) {
        // O evento acabou de abrir, recalcular o status
        calculateInitialStatus()
        return
      }

      const diffHours = Math.floor(diffSeconds / 3600)
      const diffMinutes = Math.floor((diffSeconds % 3600) / 60)
      const remainingSeconds = diffSeconds % 60

      // Formatar tempo restante
      const formattedTime =
        diffHours > 0
          ? `${diffHours}:${diffMinutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
          : `${diffMinutes}:${remainingSeconds.toString().padStart(2, "0")}`

      setTimeRemaining(formattedTime)

      // Não atualizar o statusText aqui para manter a informação do dia da semana
    }
  }

  const getStatusLabel = () => {
    if (isOpen) {
      return "Aberto"
    } else {
      return "Fechado"
    }
  }

  return (
    <div className="bg-black rounded-md overflow-hidden flex flex-col h-full">
      <div className="relative h-40 overflow-hidden">
        {event.image ? (
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.name}
            fill
            className="object-cover transition-transform hover:scale-105 duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-gray-500 text-lg">Sem imagem</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
        <h3 className="absolute bottom-0 left-0 right-0 p-4 text-xl font-bold text-white">{event.name}</h3>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <p className="text-gray-400 text-sm mb-4">{statusText}</p>

        <div className="flex justify-end items-center">
          <div className="text-right">
            <div className="text-3xl font-bold">{timeRemaining}</div>
            <div className="text-xs text-gray-400">
              {isOpen ? "até fechar" : "até abrir"}
              {nextTime && ` (${nextTime})`}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("py-2 px-4 text-right", statusClass)}>
        <span className="font-medium">{getStatusLabel()}</span>
      </div>
    </div>
  )
}
