import { NotificationForm } from "@/components/notification-form"
import { SubscriberList } from "@/components/subscriber-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Send, Settings } from "lucide-react"

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-r from-[#0c1f16] to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a página inicial
            </Button>
          </Link>

          <div className="flex gap-2">
            <Link href="/notifications/test">
              <Button variant="outline" className="text-cyan-400 border-cyan-400 hover:bg-cyan-950/20">
                <Send className="h-4 w-4 mr-2" />
                Testar notificações
              </Button>
            </Link>

            <Link href="/notifications/debug">
              <Button variant="outline" className="text-amber-400 border-amber-400 hover:bg-amber-950/20">
                <Settings className="h-4 w-4 mr-2" />
                Configurações Twilio
              </Button>
            </Link>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Gerenciar Notificações WhatsApp</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <NotificationForm />
          </div>

          <div>
            <SubscriberList />
          </div>
        </div>
      </div>
    </main>
  )
}
