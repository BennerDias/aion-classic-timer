"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Send, AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function DebugPage() {
  const [twilioAccountSid, setTwilioAccountSid] = useState("")
  const [twilioAuthToken, setTwilioAuthToken] = useState("")
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("")
  const [testPhoneNumber, setTestPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Carregar variáveis de ambiente no carregamento da página
  useEffect(() => {
    const fetchEnvVars = async () => {
      try {
        const response = await fetch("/api/debug/env")
        const data = await response.json()

        if (data.success) {
          setTwilioAccountSid(data.env.TWILIO_ACCOUNT_SID || "")
          setTwilioAuthToken(data.env.TWILIO_AUTH_TOKEN ? "••••••••••••••••" : "")
          setTwilioPhoneNumber(data.env.TWILIO_PHONE_NUMBER || "")
        } else {
          setError("Não foi possível carregar as variáveis de ambiente")
        }
      } catch (err) {
        setError("Erro ao carregar variáveis de ambiente")
      }
    }

    fetchEnvVars()
  }, [])

  const handleTestMessage = async () => {
    if (!testPhoneNumber) {
      toast({
        title: "Erro",
        description: "Por favor, informe um número de telefone para teste",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setResult(null)
      setError(null)

      const response = await fetch("/api/debug/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Mensagem de teste enviada com sucesso!",
          variant: "default",
        })
      } else {
        setError(data.error || "Erro desconhecido")
        toast({
          title: "Erro",
          description: data.error || "Ocorreu um erro ao enviar a mensagem de teste",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error("Erro ao enviar mensagem de teste:", error)
      setError(errorMessage)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a mensagem de teste",
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

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Depuração do Twilio</h1>

        <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-cyan-400">Configuração do Twilio</CardTitle>
            <CardDescription>Verifique as configurações do Twilio e envie uma mensagem de teste</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountSid">Account SID</Label>
              <Input id="accountSid" value={twilioAccountSid} readOnly className="bg-gray-800 border-gray-700" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                value={twilioAuthToken}
                type="password"
                readOnly
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número do Twilio</Label>
              <Input id="phoneNumber" value={twilioPhoneNumber} readOnly className="bg-gray-800 border-gray-700" />
              <p className="text-xs text-amber-400">
                Importante: O número do Twilio deve estar no formato internacional completo, incluindo o prefixo
                "whatsapp:" se for para WhatsApp.
                <br />
                Exemplo para WhatsApp: whatsapp:+14155238886
              </p>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <h3 className="text-lg font-medium mb-2">Enviar mensagem de teste</h3>

              <div className="space-y-2">
                <Label htmlFor="testPhone">Número para teste</Label>
                <Input
                  id="testPhone"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+5511999999999"
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-400">
                  Use o formato internacional com código do país (ex: +5511999999999)
                </p>
              </div>
            </div>

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
              onClick={handleTestMessage}
              className="w-full bg-cyan-600 hover:bg-cyan-700 mb-4"
              disabled={isLoading || !testPhoneNumber}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Enviar mensagem de teste
                </>
              )}
            </Button>

            {result && (
              <div className="bg-gray-800 p-4 rounded-md overflow-auto max-h-60">
                <h4 className="text-sm font-medium text-cyan-400 mb-2">Resultado:</h4>
                <pre className="text-xs text-gray-300">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
