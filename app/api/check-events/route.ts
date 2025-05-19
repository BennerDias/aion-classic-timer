import { checkUpcomingEventsAndNotify } from "@/lib/notification-service"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic" // Desativar cache para esta rota

export async function GET() {
  try {
    console.log("=== INICIANDO VERIFICAÇÃO DE EVENTOS ===")
    console.log("Data/Hora:", new Date().toISOString())
    console.log("Ambiente:", process.env.NODE_ENV)
    console.log("===========================================")

    const result = await checkUpcomingEventsAndNotify()
    console.log("=== RESULTADO DA VERIFICAÇÃO ===")
    console.log("Sucesso:", result.success)
    console.log("Mensagem:", result.message)
    console.log("Notificações enviadas:", result.notificationsSent || 0)
    console.log("===========================================")

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        notificationsSent: result.notificationsSent || 0,
        results: result.results || [],
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Erro desconhecido",
      })
    }
  } catch (error) {
    console.error("=== ERRO NA VERIFICAÇÃO DE EVENTOS ===")
    console.error(error)
    console.error("===========================================")

    // Garantir que sempre retornamos um JSON válido, mesmo em caso de erro
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
    })
  }
}
