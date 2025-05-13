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

        // Calcular o tempo exato em segundos até o próximo evento
        const secondsUntilNext = daysUntilNext * 24 * 60 * 60
        const hoursUntilNext = Math.floor(secondsUntilNext / 3600)
        const minutesUntilNext = Math.floor((secondsUntilNext % 3600) / 60)
        const remainingSeconds = secondsUntilNext % 60

        // Formatar o tempo restante com horas, minutos e segundos
        setTimeRemaining(
          `${hoursUntilNext}:${minutesUntilNext.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`,
        )

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
      const currentSecond = currentTime.getSeconds()
      const currentTimeSeconds = (currentHour * 60 + currentMinute) * 60 + currentSecond

      // Verificar se o evento está aberto agora
      let isCurrentlyOpen = false
      let nextOpeningTime = ""
      let timeUntilNextState = Number.POSITIVE_INFINITY

      for (const openTime of event.openTimes) {
        const [openHour, openMinute] = openTime.split(":").map(Number)
        const openTimeSeconds = (openHour * 60 + openMinute) * 60

        // Calcular o tempo de fechamento
        const closeTimeSeconds = openTimeSeconds + (event.duration || 0) * 60

        // Verificar se está aberto agora
        if (currentTimeSeconds >= openTimeSeconds && currentTimeSeconds < closeTimeSeconds) {
          isCurrentlyOpen = true

          // Calcular tempo até fechar
          const secondsUntilClose = closeTimeSeconds - currentTimeSeconds
          const hoursUntilClose = Math.floor(secondsUntilClose / 3600)
          const minutesUntilClose = Math.floor((secondsUntilClose % 3600) / 60)
          const remainingSeconds = secondsUntilClose % 60

          setTimeRemaining(
            hoursUntilClose > 0
              ? `${hoursUntilClose}:${minutesUntilClose.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
              : `${minutesUntilClose}:${remainingSeconds.toString().padStart(2, "0")}`,
          )

          setStatusText(
            `Fecha em ${hoursUntilClose > 0 ? `${hoursUntilClose}h ${minutesUntilClose}m` : `${minutesUntilClose}m ${remainingSeconds}s`}`,
          )
          setStatusClass("bg-[#33ff33]") // Verde brilhante para aberto
          setIsOpen(true)

          // Formatar horário de fechamento
          const closeHour = Math.floor(closeTimeSeconds / 3600) % 24
          const closeMinute = Math.floor((closeTimeSeconds % 3600) / 60)
          setNextTime(`${closeHour.toString().padStart(2, "0")}:${closeMinute.toString().padStart(2, "0")}`)

          break
        }

        // Se não está aberto, calcular o próximo horário de abertura
        let secondsUntilOpen

        if (openTimeSeconds > currentTimeSeconds) {
          // Próxima abertura é hoje
          secondsUntilOpen = openTimeSeconds - currentTimeSeconds
        } else {
          // Próxima abertura é amanhã
          secondsUntilOpen = 24 * 3600 - currentTimeSeconds + openTimeSeconds
        }

        if (secondsUntilOpen < timeUntilNextState) {
          timeUntilNextState = secondsUntilOpen
          nextOpeningTime = openTime

          const hoursUntilOpen = Math.floor(secondsUntilOpen / 3600)
          const minutesUntilOpen = Math.floor((secondsUntilOpen % 3600) / 60)
          const remainingSeconds = secondsUntilOpen % 60

          setTimeRemaining(
            hoursUntilOpen > 0
              ? `${hoursUntilOpen}:${minutesUntilOpen.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
              : `${minutesUntilOpen}:${remainingSeconds.toString().padStart(2, "0")}`,
          )

          setStatusText(
            `Abre em ${hoursUntilOpen > 0 ? `${hoursUntilOpen}h ${minutesUntilOpen}m` : `${minutesUntilOpen}m ${remainingSeconds}s`}`,
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
        const diffSeconds = Math.floor(diffMs / 1000)
        const diffHours = Math.floor(diffSeconds / 3600)
        const diffMinutes = Math.floor((diffSeconds % 3600) / 60)
        const remainingSeconds = diffSeconds % 60

        // Formatar tempo restante
        let formattedTime = ""
        if (diffHours > 0) {
          formattedTime = `${diffHours}:${diffMinutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
        } else {
          formattedTime = `${diffMinutes}:${remainingSeconds.toString().padStart(2, "0")}`
        }

        setTimeRemaining(formattedTime)
        setStatusText(
          `Fecha em ${diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m ${remainingSeconds}s`}`,
        )
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
        const diffSeconds = Math.floor(diffMs / 1000)
        const diffHours = Math.floor(diffSeconds / 3600)
        const diffMinutes = Math.floor((diffSeconds % 3600) / 60)
        const remainingSeconds = diffSeconds % 60

        // Formatar tempo restante
        let formattedTime = ""
        if (diffHours > 0) {
          formattedTime = `${diffHours}:${diffMinutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
        } else {
          formattedTime = `${diffMinutes}:${remainingSeconds.toString().padStart(2, "0")}`
        }

        setTimeRemaining(formattedTime)
        setStatusText(
          `Abre em ${diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m ${remainingSeconds}s`}`,
        )
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
