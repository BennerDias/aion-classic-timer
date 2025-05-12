"use client"

import { useState, useEffect } from "react"
import { EventCard } from "@/components/event-card"
import { events } from "@/data/events"
import Image from "next/image"

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <main className="min-h-screen bg-[#10281d] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="w-20"></div> {/* Espaçador para equilíbrio */}
          <div className="flex-1 flex justify-center">
            <Image
              src="/favicon.ico"
              alt="The Life Snake Logo"
              width={500}
              height={500}
              className="h-24 w-auto"
              priority
            />
          </div>
          <div className="w-20"></div> {/* Espaçador para equilíbrio */}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Aion Classic - Timer</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} currentTime={currentTime} />
          ))}
        </div>
      </div>
    </main>
  )
}
