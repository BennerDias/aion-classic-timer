"use client"

import type React from "react"

import { useState } from "react"
import { subscribeToEvents } from "@/app/actions/notification-actions"
import { events } from "@/data/events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function NotificationForm() {
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber) {
      toast({
        title: "Erro",
        description: "Por favor, informe um número de WhatsApp válido",
        variant: "destructive",
      })
      return
    }

    if (selectedEvents.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um evento",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await subscribeToEvents({
        name,
        phone_number: phoneNumber,
        event_ids: selectedEvents,
      })

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
          variant: "default",
        })

        // Limpar o formulário
        setName("")
        setPhoneNumber("")
        setSelectedEvents([])
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua inscrição",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
  }

  const handleSelectAll = () => {
    if (selectedEvents.length === events.length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(events.map((event) => event.id))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl text-cyan-400">Receba notificações via WhatsApp</CardTitle>
        <CardDescription>
          Cadastre seu número para receber alertas 30 minutos antes dos eventos começarem
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome (opcional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="bg-gray-800 border-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center">
              Número do WhatsApp <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+5511999999999"
              required
              className="bg-gray-800 border-gray-700"
            />
            <p className="text-xs text-gray-400">Use o formato internacional com código do país (ex: +5511999999999)</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center">
                Selecione os eventos <span className="text-red-500 ml-1">*</span>
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={handleSelectAll} className="text-xs h-7 px-2">
                {selectedEvents.length === events.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-800 rounded-md">
              {events.map((event) => (
                <div key={event.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`event-${event.id}`}
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => handleEventToggle(event.id)}
                  />
                  <Label htmlFor={`event-${event.id}`} className="cursor-pointer text-sm">
                    {event.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={isSubmitting}>
            {isSubmitting ? "Processando..." : "Inscrever-se para notificações"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
