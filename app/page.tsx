"use client"

import { useState, useEffect } from "react"
import { EventCard } from "@/components/event-card"
import { events as allEvents } from "@/data/events"
import Image from "next/image"
import type { Event } from "@/types/event"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

// Interface para eventos com informações de status calculadas
interface EventWithStatus extends Event {
  isOpen: boolean
  nextEventTime: Date | null
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
      if (!a.isOpen && !b.isOpen && a.nextEventTime && b.nextEventTime) {
        return a.nextEventTime.getTime() - b.nextEventTime.getTime()
      }

      // Terceiro critério: por ordem de exibição
      return a.displayOrder - b.displayOrder
    })

    setSortedEvents(sorted)
  }, [currentTime])

  // Função para calcular o status de um evento
  function calculateEventStatus(
    event: Event,
    currentTime: Date,
  ): { isOpen: boolean; nextEventTime: Date | null; displayOrder: number } {
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

        // Se encontramos uma data para hoje, verificar se o evento está aberto agora
        if (dayOffset === 0 && nextDate) {
          // Verificar se o evento está aberto agora
          const closeDate = new Date(nextDate)
          closeDate.setMinutes(closeDate.getMinutes() + (event.duration || 60))

          if (currentTime >= nextDate && currentTime < closeDate) {
            return {
              isOpen: true,
              nextEventTime: closeDate,
              displayOrder: 1,
            }
          }
        }
      }
    }

    // Se chegamos aqui, o evento não está aberto
    if (nextDate) {
      // Determinar a ordem de exibição com base no tempo até abrir
      const diffMs = nextDate.getTime() - currentTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      const displayOrder = diffHours < 1 ? 2 : 3 // Prioridade 2 se abrir em menos de 1 hora

      return {
        isOpen: false,
        nextEventTime: nextDate,
        displayOrder,
      }
    }

    // Fallback para eventos sem horário definido
    return {
      isOpen: false,
      nextEventTime: null,
      displayOrder: 4,
    }
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

        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <h1 id="title" className="text-3xl md:text-4xl font-bold text-center mb-4 md:mb-0">
            Aion classic timer
          </h1>

          <Link href="/notifications">
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Bell className="h-4 w-4 mr-2" />
              Receber notificações WhatsApp
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} currentTime={currentTime} />
          ))}
        </div>
      </div>
    </main>
  )
}
