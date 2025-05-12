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

  useEffect(() => {
    updateEventStatus()
  }, [currentTime])

  function updateEventStatus() {
    // Obter o dia atual da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const currentDay = currentTime.getDay()
    // Converter para nosso formato (0 = Segunda, ..., 6 = Domingo)
    const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1

    // Verificar se o evento ocorre no dia atual
    const eventDays = Array.isArray(event.day) ? event.day : [event.day]
    const isEventDay = eventDays.includes(adjustedCurrentDay)

    if (!isEventDay) {
      // Encontrar o próximo dia em que o evento ocorre
      let nextDay = -1
      let daysUntilNext = 7 // Máximo de dias em uma semana

      for (const day of eventDays) {
        let diff = day - adjustedCurrentDay
        if (diff <= 0) diff += 7 // Se for no passado, adiciona uma semana
        if (diff < daysUntilNext) {
          daysUntilNext = diff
          nextDay = day
        }
      }

      if (nextDay !== -1) {
        const dayNames = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
        setTimeRemaining(`${daysUntilNext}d`)
        setStatusText(`Próximo em ${dayNames[nextDay]}`)
        setStatusClass("bg-red-600") // Vermelho para fechado
        setIsOpen(false)
        setNextTime(event.time || (event.openTimes && event.openTimes[0]) || "")
      }

      return
    }

    // Processar eventos com múltiplos horários de abertura
    if (event.openTimes && event.openTimes.length > 0) {
      const now = currentTime.getTime()
      const currentHour = currentTime.getHours()
      const currentMinute = currentTime.getMinutes()
      const currentTimeMinutes = currentHour * 60 + currentMinute

      // Verificar se o evento está aberto agora
      let isCurrentlyOpen = false
      let nextOpeningTime = ""
      let timeUntilNextState = Number.POSITIVE_INFINITY

      for (const openTime of event.openTimes) {
        const [openHour, openMinute] = openTime.split(":").map(Number)
        const openTimeMinutes = openHour * 60 + openMinute

        // Calcular o tempo de fechamento
        const closeTimeMinutes = openTimeMinutes + (event.duration || 0)

        // Verificar se está aberto agora
        if (currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes) {
          isCurrentlyOpen = true

          // Calcular tempo até fechar
          const minutesUntilClose = closeTimeMinutes - currentTimeMinutes
          const hoursUntilClose = Math.floor(minutesUntilClose / 60)
          const remainingMinutes = minutesUntilClose % 60

          setTimeRemaining(
            hoursUntilClose > 0
              ? `${hoursUntilClose}:${remainingMinutes.toString().padStart(2, "0")}`
              : `${remainingMinutes}:00`,
          )

          setStatusText(
            `Fecha em ${hoursUntilClose > 0 ? `${hoursUntilClose}h ${remainingMinutes}m` : `${remainingMinutes}m`}`,
          )
          setStatusClass("bg-[#33ff33]") // Verde brilhante para aberto
          setIsOpen(true)

          // Formatar horário de fechamento
          const closeHour = Math.floor(closeTimeMinutes / 60) % 24
          const closeMinute = closeTimeMinutes % 60
          setNextTime(`${closeHour.toString().padStart(2, "0")}:${closeMinute.toString().padStart(2, "0")}`)

          break
        }

        // Se não está aberto, calcular o próximo horário de abertura
        let minutesUntilOpen

        if (openTimeMinutes > currentTimeMinutes) {
          // Próxima abertura é hoje
          minutesUntilOpen = openTimeMinutes - currentTimeMinutes
        } else {
          // Próxima abertura é amanhã
          minutesUntilOpen = 24 * 60 - currentTimeMinutes + openTimeMinutes
        }

        if (minutesUntilOpen < timeUntilNextState) {
          timeUntilNextState = minutesUntilOpen
          nextOpeningTime = openTime

          const hoursUntilOpen = Math.floor(minutesUntilOpen / 60)
          const remainingMinutes = minutesUntilOpen % 60

          setTimeRemaining(
            hoursUntilOpen > 0
              ? `${hoursUntilOpen}:${remainingMinutes.toString().padStart(2, "0")}`
              : `${remainingMinutes}:00`,
          )

          setStatusText(
            `Abre em ${hoursUntilOpen > 0 ? `${hoursUntilOpen}h ${remainingMinutes}m` : `${remainingMinutes}m`}`,
          )
          setStatusClass("bg-red-600") // Vermelho para fechado
          setIsOpen(false)
          setNextTime(nextOpeningTime)
        }
      }

      return
    }

    // Processar eventos com horário único
    if (event.time) {
      const now = currentTime.getTime()
      const [eventHour, eventMinute] = event.time.split(":").map(Number)

      // Criar data para o horário de abertura do evento
      const openDate = new Date(currentTime)
      openDate.setHours(eventHour, eventMinute, 0, 0)

      // Criar data para o horário de fechamento do evento
      const closeDate = new Date(openDate)
      closeDate.setMinutes(closeDate.getMinutes() + (event.duration || 60))

      // Verificar se o evento está aberto agora
      if (now >= openDate.getTime() && now < closeDate.getTime()) {
        // Evento está aberto, calcular tempo até fechar
        const diffMs = closeDate.getTime() - now
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000)

        // Formatar tempo restante
        let formattedTime = ""
        if (diffHours > 0) {
          formattedTime = `${diffHours}:${diffMinutes.toString().padStart(2, "0")}`
        } else {
          formattedTime = `${diffMinutes}:${diffSeconds.toString().padStart(2, "0")}`
        }

        setTimeRemaining(formattedTime)
        setStatusText(`Fecha em ${diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m ${diffSeconds}s`}`)
        setStatusClass("bg-[#33ff33]") // Verde brilhante para aberto
        setIsOpen(true)

        // Formatar horário de fechamento
        setNextTime(
          `${closeDate.getHours().toString().padStart(2, "0")}:${closeDate.getMinutes().toString().padStart(2, "0")}`,
        )
      } else {
        // Evento está fechado, calcular tempo até abrir

        // Se o horário de abertura já passou hoje, ajustar para amanhã
        if (openDate.getTime() < now) {
          openDate.setDate(openDate.getDate() + 1)
        }

        const diffMs = openDate.getTime() - now
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000)

        // Formatar tempo restante
        let formattedTime = ""
        if (diffHours > 0) {
          formattedTime = `${diffHours}:${diffMinutes.toString().padStart(2, "0")}`
        } else {
          formattedTime = `${diffMinutes}:${diffSeconds.toString().padStart(2, "0")}`
        }

        setTimeRemaining(formattedTime)
        setStatusText(`Abre em ${diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m ${diffSeconds}s`}`)
        setStatusClass("bg-red-600") // Vermelho para fechado
        setIsOpen(false)
        setNextTime(event.time)
      }

      return
    }

    // Fallback para eventos sem horário definido
    setTimeRemaining("--:--")
    setStatusText("Horário não disponível")
    setStatusClass("bg-gray-800")
    setIsOpen(false)
    setNextTime("")
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
