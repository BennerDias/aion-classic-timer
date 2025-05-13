"use client"

import { useState, useEffect } from "react"
import { EventCard } from "@/components/event-card"
import { events as allEvents } from "@/data/events"
import Image from "next/image"
import type { Event } from "@/types/event"

// Interface para eventos com informações de status calculadas
interface EventWithStatus extends Event {
  isOpen: boolean
  timeUntilNextState: number // em segundos
  displayOrder: number // ordem de exibição
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sortedEvents, setSortedEvents] = useState<EventWithStatus[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Calcular o status dos eventos e ordená-los
  useEffect(() => {
    const eventsWithStatus = allEvents.map((event) => {
      const status = calculateEventStatus(event, currentTime)
      return {
        ...event,
        ...status,
      }
    })

    // Ordenar eventos: primeiro os abertos, depois os prestes a abrir, depois os demais
    const sorted = eventsWithStatus.sort((a, b) => {
      // Primeiro critério: eventos abertos vêm primeiro
      if (a.isOpen && !b.isOpen) return -1
      if (!a.isOpen && b.isOpen) return 1

      // Segundo critério: para eventos não abertos, ordenar por tempo até abrir
      if (!a.isOpen && !b.isOpen) {
        return a.timeUntilNextState - b.timeUntilNextState
      }

      // Terceiro critério: para eventos abertos, ordenar por tempo até fechar
      if (a.isOpen && b.isOpen) {
        return a.timeUntilNextState - b.timeUntilNextState
      }

      return 0
    })

    setSortedEvents(sorted)
  }, [currentTime])

  // Função para calcular o status de um evento
  function calculateEventStatus(
    event: Event,
    currentTime: Date,
  ): { isOpen: boolean; timeUntilNextState: number; displayOrder: number } {
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
        // Calcular o tempo exato em segundos até o próximo evento
        const secondsUntilNext = daysUntilNext * 24 * 60 * 60
        return { isOpen: false, timeUntilNextState: secondsUntilNext, displayOrder: 3 }
      }
    }

    const now = currentTime.getTime()
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentSecond = currentTime.getSeconds()
    const currentTimeSeconds = (currentHour * 60 + currentMinute) * 60 + currentSecond

    // Processar eventos com múltiplos horários de abertura
    if (event.openTimes && event.openTimes.length > 0) {
      // Verificar se o evento está aberto agora
      for (const openTime of event.openTimes) {
        const [openHour, openMinute] = openTime.split(":").map(Number)
        const openTimeSeconds = (openHour * 60 + openMinute) * 60

        // Calcular o tempo de fechamento
        const closeTimeSeconds = openTimeSeconds + (event.duration || 0) * 60

        // Verificar se está aberto agora
        if (isEventDay && currentTimeSeconds >= openTimeSeconds && currentTimeSeconds < closeTimeSeconds) {
          const secondsUntilClose = closeTimeSeconds - currentTimeSeconds
          return { isOpen: true, timeUntilNextState: secondsUntilClose, displayOrder: 1 }
        }
      }

      // Se não está aberto, encontrar o próximo horário de abertura
      let nextOpeningTime = Number.POSITIVE_INFINITY
      let nextOpenDay = 0

      // Verificar todos os dias da semana
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDay = (adjustedCurrentDay + dayOffset) % 7

        // Verificar se o evento ocorre neste dia
        if (eventDays.includes(checkDay)) {
          for (const openTime of event.openTimes) {
            const [openHour, openMinute] = openTime.split(":").map(Number)

            // Criar data para este horário
            const openDate = new Date(currentTime)
            openDate.setDate(currentTime.getDate() + dayOffset)
            openDate.setHours(openHour, openMinute, 0, 0)

            // Calcular segundos até este horário
            const diffSeconds = Math.floor((openDate.getTime() - currentTime.getTime()) / 1000)

            // Se este horário já passou hoje, ignorar
            if (dayOffset === 0 && diffSeconds < 0) continue

            if (diffSeconds < nextOpeningTime) {
              nextOpeningTime = diffSeconds
              nextOpenDay = dayOffset
            }
          }

          // Se encontramos um horário neste dia, e não é hoje, podemos parar
          if (nextOpenDay > 0 && nextOpeningTime < Number.POSITIVE_INFINITY) break
        }
      }

      // Determinar a ordem de exibição com base no tempo até abrir
      const displayOrder = nextOpeningTime < 3600 ? 2 : 3 // Prioridade 2 se abrir em menos de 1 hora

      return { isOpen: false, timeUntilNextState: nextOpeningTime, displayOrder }
    }

    // Processar eventos com horário único
    if (event.time) {
      const [eventHour, eventMinute] = event.time.split(":").map(Number)

      // Verificar todos os dias da semana
      let nextOpenDate = null
      let minDiffSeconds = Number.POSITIVE_INFINITY

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDay = (adjustedCurrentDay + dayOffset) % 7

        // Verificar se o evento ocorre neste dia
        if (eventDays.includes(checkDay)) {
          // Criar data para este horário
          const openDate = new Date(currentTime)
          openDate.setDate(currentTime.getDate() + dayOffset)
          openDate.setHours(eventHour, eventMinute, 0, 0)

          // Calcular segundos até este horário
          const diffSeconds = Math.floor((openDate.getTime() - currentTime.getTime()) / 1000)

          // Se este horário já passou hoje, ignorar
          if (dayOffset === 0 && diffSeconds < 0) continue

          if (diffSeconds < minDiffSeconds) {
            minDiffSeconds = diffSeconds
            nextOpenDate = openDate
          }

          // Se encontramos um horário neste dia, e não é hoje, podemos parar
          if (dayOffset > 0 && minDiffSeconds < Number.POSITIVE_INFINITY) break
        }
      }

      // Se encontramos uma próxima data
      if (nextOpenDate) {
        const closeDate = new Date(nextOpenDate)
        closeDate.setMinutes(closeDate.getMinutes() + (event.duration || 60))

        // Verificar se o evento está aberto agora
        if (isEventDay && currentTime >= nextOpenDate && currentTime < closeDate) {
          const diffSeconds = Math.floor((closeDate.getTime() - currentTime.getTime()) / 1000)
          return { isOpen: true, timeUntilNextState: diffSeconds, displayOrder: 1 }
        } else {
          // Evento está fechado
          const displayOrder = minDiffSeconds < 3600 ? 2 : 3 // Prioridade 2 se abrir em menos de 1 hora
          return { isOpen: false, timeUntilNextState: minDiffSeconds, displayOrder }
        }
      }
    }

    // Fallback para eventos sem horário definido
    return { isOpen: false, timeUntilNextState: Number.POSITIVE_INFINITY, displayOrder: 4 }
  }

  return (
    <main className="min-h-screen bg-gradient-to-r from-[#0c1f16] to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-12">
          <Image
            src="/images/logo-transparent.png"
            alt="The Life Snake Logo"
            width={600}
            height={600}
            className="h-32 w-auto"
            priority
          />
        </div>

        <h1 id="title" className="text-3xl md:text-4xl font-bold text-center mb-8">
          Aion classic timer
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} currentTime={currentTime} />
          ))}
        </div>
      </div>
    </main>
  )
}
