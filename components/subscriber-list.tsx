"use client"

import { useState, useEffect } from "react"
import { getSubscribers, removeSubscriber, toggleSubscriberStatus } from "@/app/actions/notification-actions"
import { events } from "@/data/events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Trash2, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Subscriber {
  id: string
  name: string | null
  phone_number: string
  active: boolean
  created_at: string
  updated_at: string
  notifications: {
    id: string
    event_id: string
    subscriber_id: string
    created_at: string
  }[]
}

export function SubscriberList() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Carregar assinantes ao montar o componente
  useEffect(() => {
    loadSubscribers()
  }, [])

  // Função para carregar os assinantes
  const loadSubscribers = async () => {
    try {
      setIsLoading(true)
      const result = await getSubscribers()

      if (result.success) {
        setSubscribers(result.subscribers as Subscriber[])
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
        description: "Ocorreu um erro ao carregar os assinantes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar a lista
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadSubscribers()
    setIsRefreshing(false)
  }

  // Função para remover um assinante
  const handleRemove = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este assinante?")) {
      return
    }

    try {
      const result = await removeSubscriber(id)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
          variant: "default",
        })

        // Atualizar a lista localmente
        setSubscribers((prev) => prev.filter((s) => s.id !== id))
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
        description: "Ocorreu um erro ao remover o assinante",
        variant: "destructive",
      })
    }
  }

  // Função para ativar/desativar um assinante
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleSubscriberStatus(id, !currentStatus)

      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
          variant: "default",
        })

        // Atualizar a lista localmente
        setSubscribers((prev) => prev.map((s) => (s.id === id ? { ...s, active: !currentStatus } : s)))
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
        description: "Ocorreu um erro ao atualizar o status do assinante",
        variant: "destructive",
      })
    }
  }

  // Função para obter o nome do evento pelo ID
  const getEventName = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    return event ? event.name : "Evento desconhecido"
  }

  return (
    <Card className="w-full bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl text-cyan-400">Assinantes WhatsApp</CardTitle>
          <CardDescription>Gerenciar assinantes das notificações via WhatsApp</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhum assinante encontrado</div>
        ) : (
          <div className="space-y-4">
            {subscribers.map((subscriber) => (
              <div key={subscriber.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">
                      {subscriber.name || "Sem nome"}
                      <span className="ml-2 text-gray-400 text-sm">({subscriber.phone_number})</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Cadastrado em {new Date(subscriber.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={subscriber.active}
                        onCheckedChange={() => handleToggleStatus(subscriber.id, subscriber.active)}
                      />
                      <span className="text-sm">
                        {subscriber.active ? (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Ativo
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center">
                            <XCircle className="h-4 w-4 mr-1" /> Inativo
                          </span>
                        )}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(subscriber.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Eventos inscritos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {subscriber.notifications.length === 0 ? (
                      <span className="text-sm text-gray-400">Nenhum evento selecionado</span>
                    ) : (
                      subscriber.notifications.map((notification) => (
                        <Badge key={notification.id} variant="secondary" className="bg-gray-700 hover:bg-gray-600">
                          {getEventName(notification.event_id)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
