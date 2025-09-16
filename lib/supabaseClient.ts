// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Read from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Safety check: throw clear error if missing
if (!supabaseUrl) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
