"use client"

import { useState } from "react"
import { EventCard } from "./event-card"
import type { Event } from "@/types/event"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMediaQuery } from "@/app/hooks/use-media-query"

interface WeeklyScheduleProps {
  events: Event[]
}

export function WeeklySchedule({ events }: WeeklyScheduleProps) {
  const [currentDay, setCurrentDay] = useState<number | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

  const timeSlots = [
    "00:00",
    "02:00",
    "04:00",
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00",
  ]

  const handlePrevDay = () => {
    if (currentDay === null) {
      setCurrentDay(6)
    } else if (currentDay === 0) {
      setCurrentDay(6)
    } else {
      setCurrentDay(currentDay - 1)
    }
  }

  const handleNextDay = () => {
    if (currentDay === null) {
      setCurrentDay(0)
    } else if (currentDay === 6) {
      setCurrentDay(0)
    } else {
      setCurrentDay(currentDay + 1)
    }
  }

  const getEventsForTimeAndDay = (time: string, day: number) => {
    return events.filter((event) => event.time === time && event.day === day)
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      {isMobile ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-cyan-400" />
            </button>
            <h2 className="text-xl font-bold text-center">
              {currentDay !== null ? days[currentDay] : "Todos os dias"}
            </h2>
            <button
              onClick={handleNextDay}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-cyan-400" />
            </button>
          </div>

          <div className="space-y-4">
            {timeSlots.map((time) => {
              const dayEvents =
                currentDay !== null
                  ? getEventsForTimeAndDay(time, currentDay)
                  : days.flatMap((_, dayIndex) => getEventsForTimeAndDay(time, dayIndex))

              if (dayEvents.length === 0) return null

              return (
                <div key={time} className="border-t border-gray-700 pt-2">
                  <h3 className="text-lg font-semibold mb-2 text-cyan-300">{time}</h3>
                  <div className="grid gap-2">
                    {dayEvents.map((event, index) => (
                      <div key={`${event.id}-${index}`} className="mb-2">
                        {currentDay === null && <div className="text-sm text-cyan-500 mb-1">{days[event.day]}</div>}
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-700">
                <th className="p-3 text-left min-w-[100px]">Horário</th>
                {days.map((day, index) => (
                  <th key={day} className="p-3 text-center min-w-[150px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="p-3 font-medium text-cyan-300">{time}</td>
                  {days.map((_, dayIndex) => {
                    const cellEvents = getEventsForTimeAndDay(time, dayIndex)
                    return (
                      <td key={`${time}-${dayIndex}`} className="p-2 align-top">
                        <div className="flex flex-col gap-2">
                          {cellEvents.map((event, index) => (
                            <EventCard key={`${event.id}-${index}`} event={event} />
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
