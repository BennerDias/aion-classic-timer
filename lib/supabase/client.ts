"use client"

import { createClient } from "@supabase/supabase-js"

// Criando o cliente Supabase para uso no cliente
let supabaseClient: ReturnType<typeof createClient> | null = null

export const createClientSupabaseClient = () => {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and key must be provided")
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}
