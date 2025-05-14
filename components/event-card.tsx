"use client"

import { useState, useEffect, useRef } from "react"
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

  // Usar refs para armazenar as datas para evitar re-renderizações
  const nextEventDateRef = useRef<Date | null>(null)
  const nextCloseDateRef = useRef<Date | null>(null)

  // Ref para controlar se o componente está montado
  const isMountedRef = useRef(true)

  // Efeito para calcular o status inicial
  useEffect(() => {
    // Calcular o status inicial
    calculateEventStatus()

    // Limpar quando o componente for desmontado
    return () => {
      isMountedRef.current = false
    }
  }, [event, currentTime]) // Dependências: evento e tempo atual

  // Efeito separado para configurar o timer
  useEffect(() => {
    // Configurar um intervalo para atualizar o tempo restante a cada segundo
    const intervalId = setInterval(() => {
      updateTimeRemaining()
    }, 1000)

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId)
  }, []) // Sem dependências - executa apenas uma vez

  // Função para calcular o status do evento e definir as próximas datas importantes
  function calculateEventStatus() {
    const now = new Date() // Usar a hora atual, não a hora passada como prop

    // Obter o dia atual da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
    const currentDay = now.getDay()
    // Converter para nosso formato (0 = Segunda, ..., 6 = Domingo)
    const adjustedCurrentDay = currentDay === 0 ? 6 : currentDay - 1

    // Verificar se o evento ocorre no dia atual
    const eventDays = Array.isArray(event.day) ? event.day : [event.day]

    // Primeiro, verificar se o evento está aberto agora
    // Verificar todos os dias da semana, começando pelo dia atual
    let isEventOpen = false
    let openUntil: Date | null = null

    // Verificar se o evento está aberto agora
    if (eventDays.includes(adjustedCurrentDay)) {
      // Verificar horários de abertura
      if (event.openTimes && event.openTimes.length > 0) {
        for (const openTime of event.openTimes) {
          if (typeof openTime !== "string") continue

          const timeParts = openTime.split(":")
          if (timeParts.length !== 2) continue

          const openHour = Number.parseInt(timeParts[0], 10)
          const openMinute = Number.parseInt(timeParts[1], 10)

          if (isNaN(openHour) || isNaN(openMinute)) continue

          // Criar data para este horário de abertura
          const openDate = new Date(now)
          openDate.setHours(openHour, openMinute, 0, 0)

          // Calcular horário de fechamento
          const closeDate = new Date(openDate)
          closeDate.setMinutes(closeDate.getMinutes() + (event.duration || 60))

          // Verificar se o evento está aberto agora
          if (now >= openDate && now < closeDate) {
            isEventOpen = true
            openUntil = closeDate
            break
          }
        }
      } else if (event.time) {
        if (typeof event.time === "string") {
          const timeParts = event.time.split(":")
          if (timeParts.length === 2) {
            const openHour = Number.parseInt(timeParts[0], 10)
            const openMinute = Number.parseInt(timeParts[1], 10)

            if (!isNaN(openHour) && !isNaN(openMinute)) {
              // Criar data para este horário de abertura
              const openDate = new Date(now)
              openDate.setHours(openHour, openMinute, 0, 0)

              // Calcular horário de fechamento
              const closeDate = new Date(openDate)
              closeDate.setMinutes(closeDate.getMinutes() + (event.duration || 60))

              // Verificar se o evento está aberto agora
              if (now >= openDate && now < closeDate) {
                isEventOpen = true
                openUntil = closeDate
              }
            }
          }
        }
      }
    }

    // Se o evento estiver aberto agora
    if (isEventOpen && openUntil) {
      setIsOpen(true)
      nextCloseDateRef.current = openUntil
      setStatusClass("bg-[#33ff33]") // Verde brilhante para aberto

      // Formatar horário de fechamento
      setNextTime(
        `${openUntil.getHours().toString().padStart(2, "0")}:${openUntil.getMinutes().toString().padStart(2, "0")}`,
      )

      // Atualizar o tempo restante para fechamento
      updateTimeRemainingToClose(openUntil)
      return
    }

    // Se o evento não estiver aberto, encontrar a próxima abertura
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
            const openDate = new Date(now)
            openDate.setDate(now.getDate() + dayOffset)
            openDate.setHours(openHour, openMinute, 0, 0)

            // Se este horário já passou hoje, ignorar
            if (dayOffset === 0 && openDate <= now) continue

            const diffMs = openDate.getTime() - now.getTime()
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
          const openDate = new Date(now)
          openDate.setDate(now.getDate() + dayOffset)
          openDate.setHours(eventHour, eventMinute, 0, 0)

          // Se este horário já passou hoje, ignorar
          if (dayOffset === 0 && openDate <= now) continue

          const diffMs = openDate.getTime() - now.getTime()
          if (diffMs < minDiffMs) {
            minDiffMs = diffMs
            nextDate = openDate
          }
        }
      }
    }

    // Evento está fechado, próxima abertura
    if (nextDate) {
      nextEventDateRef.current = nextDate
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

      // Atualizar o tempo restante para abertura
      updateTimeRemainingToOpen(nextDate)
    } else {
      // Fallback para eventos sem horário definido
      setTimeRemaining("--:--")
      setStatusText("Horário não disponível")
      setStatusClass("bg-gray-800")
      setIsOpen(false)
      setNextTime("")
    }
  }

  // Função para atualizar o tempo restante até a abertura
  function updateTimeRemainingToOpen(nextDate: Date) {
    const now = new Date()
    const diffMs = nextDate.getTime() - now.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)

    if (diffSeconds <= 0) {
      // O evento pode ter aberto, mas não vamos recalcular aqui
      // Isso será feito no próximo tick do intervalo
      return
    }

    const diffHours = Math.floor(diffSeconds / 3600)
    const diffMinutes = Math.floor((diffSeconds % 3600) / 60)
    const remainingSeconds = diffSeconds % 60

    // Formatar tempo restante
    const formattedTime = `${diffHours}:${diffMinutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`

    setTimeRemaining(formattedTime)
  }

  // Função para atualizar o tempo restante até o fechamento
  function updateTimeRemainingToClose(closeDate: Date) {
    const now = new Date()
    const diffMs = closeDate.getTime() - now.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)

    if (diffSeconds <= 0) {
      // O evento pode ter fechado, mas não vamos recalcular aqui
      // Isso será feito no próximo tick do intervalo
      return
    }

    const diffHours = Math.floor(diffSeconds / 3600)
    const diffMinutes = Math.floor((diffSeconds % 3600) / 60)
    const remainingSeconds = diffSeconds % 60

    // Formatar tempo restante
    const formattedTime = `${diffHours}:${diffMinutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`

    setTimeRemaining(formattedTime)
    setStatusText(
      `Fecha em ${diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m ${remainingSeconds}s`}`,
    )
  }

  // Função para atualizar o tempo restante a cada segundo
  function updateTimeRemaining() {
    // Verificar se o componente ainda está montado
    if (!isMountedRef.current) return

    const now = new Date()

    // Verificar se precisamos recalcular o status do evento
    if (isOpen && nextCloseDateRef.current && now >= nextCloseDateRef.current) {
      // O evento fechou, recalcular o status
      calculateEventStatus()
      return
    }

    if (!isOpen && nextEventDateRef.current && now >= nextEventDateRef.current) {
      // O evento abriu, recalcular o status
      calculateEventStatus()
      return
    }

    // Atualizar o tempo restante sem recalcular o status
    if (isOpen && nextCloseDateRef.current) {
      // Evento está aberto, atualizar tempo até fechar
      updateTimeRemainingToClose(nextCloseDateRef.current)
    } else if (!isOpen && nextEventDateRef.current) {
      // Evento está fechado, atualizar tempo até abrir
      updateTimeRemainingToOpen(nextEventDateRef.current)
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
