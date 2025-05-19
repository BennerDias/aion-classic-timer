"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Send, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function TestNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<string | null>(null)

  const handleTestNotifications = async () => {
    try {
      setIsLoading(true)
      setResult(null)
      setError(null)
      setRawResponse(null)

      console.log("Enviando solicitação para /api/check-events...")

      const response = await fetch("/api/check-events", {
        // Adicionar cabeçalhos para evitar cache
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      console.log("Resposta recebida:", response.status, response.statusText)

      // Verificar se a resposta é bem-sucedida
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erro na resposta:", errorText)
        setRawResponse(errorText)
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
      }

      // Obter o texto da resposta para debug
      const responseText = await response.text()
      console.log("Texto da resposta:", responseText)
      setRawResponse(responseText)

      // Tentar analisar a resposta como JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (jsonError) {
        console.error("Erro ao analisar JSON:", jsonError)
        throw new Error(`Erro ao analisar resposta JSON: ${responseText.substring(0, 100)}...`)
      }

      console.log("Dados analisados:", data)
      setResult(data)

      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message || `Verificação concluída. ${data.notificationsSent || 0} notificações enviadas.`,
          variant: "default",
        })
      } else {
        setError(data.error || "Erro desconhecido")
        toast({
          title: "Erro",
          description: data.error || "Ocorreu um erro ao verificar eventos",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error("Erro ao testar notificações:", error)
      setError(errorMessage)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao testar notificações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-r from-[#0c1f16] to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/notifications">
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para gerenciamento de notificações
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Testar Notificações</h1>

        <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-cyan-400">Verificar eventos e enviar notificações</CardTitle>
            <CardDescription>
              Este teste verifica eventos que começarão em 30 minutos e envia notificações para os assinantes
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-gray-400 mb-4">
              Ao clicar no botão abaixo, o sistema verificará todos os eventos e enviará notificações para os assinantes
              que optaram por receber alertas para eventos que começarão em 30 minutos.
            </p>
            <p className="text-amber-400 text-sm mb-4">
              Nota: Em um ambiente de produção, esta verificação é executada automaticamente a cada minuto através de um
              cron job.
            </p>
            <p className="text-green-400 text-sm">
              Para fins de teste, uma notificação de teste será enviada para o primeiro assinante ativo, mesmo que
              nenhum evento esteja prestes a começar.
            </p>

            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-medium">Erro detectado:</h4>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-stretch">
            <Button
              onClick={handleTestNotifications}
              className="w-full bg-cyan-600 hover:bg-cyan-700 mb-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Verificando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Testar notificações
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400 mr-2" />
                    )}
                    <h4 className="text-sm font-medium text-cyan-400">Status:</h4>
                    <span className={`ml-2 ${result.success ? "text-green-400" : "text-red-400"}`}>
                      {result.success ? "Sucesso" : "Falha"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-2">{result.message}</p>

                  {result.notificationsSent > 0 && (
                    <p className="text-sm text-cyan-300">Notificações enviadas: {result.notificationsSent}</p>
                  )}
                </div>

                {result.results && result.results.length > 0 && (
                  <div className="bg-gray-800 p-4 rounded-md overflow-auto max-h-60">
                    <h4 className="text-sm font-medium text-cyan-400 mb-2">Detalhes das notificações:</h4>
                    <div className="space-y-2">
                      {result.results.map((notification: any, index: number) => (
                        <div key={index} className="p-2 border border-gray-700 rounded">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-300">Assinante: {notification.subscriber}</span>
                            {notification.isTest && (
                              <span className="text-xs bg-amber-800 text-amber-300 px-1 rounded">TESTE</span>
                            )}
                            {notification.testMode && (
                              <span className="text-xs bg-purple-800 text-purple-300 px-1 rounded">MODO TESTE</span>
                            )}
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-300">Evento: {notification.event}</span>
                            {notification.success ? (
                              <span className="text-xs text-green-400">Enviado</span>
                            ) : (
                              <span className="text-xs text-red-400">Falha</span>
                            )}
                          </div>
                          {!notification.success && notification.error && (
                            <p className="text-xs text-red-400 mt-1">{notification.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-800 p-4 rounded-md overflow-auto max-h-60">
                  <h4 className="text-sm font-medium text-cyan-400 mb-2">Resposta completa:</h4>
                  <pre className="text-xs text-gray-300">{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}

            {rawResponse && !result && (
              <div className="mt-4 bg-gray-800 p-4 rounded-md overflow-auto max-h-60">
                <h4 className="text-sm font-medium text-amber-400 mb-2">Resposta bruta (para debug):</h4>
                <pre className="text-xs text-gray-300">{rawResponse}</pre>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
