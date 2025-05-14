import { createClient } from "@supabase/supabase-js"

// Criando o cliente Supabase para uso no servidor
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and key must be provided")
  }

  return createClient(supabaseUrl, supabaseKey)
}
