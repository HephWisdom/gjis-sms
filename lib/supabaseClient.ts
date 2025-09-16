import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'


export const supabase = createClientComponentClient()
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!SUPABASE_URL) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL')
if (!SUPABASE_ANON_KEY) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
export const supabaseAdmin = createClientComponentClient({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
})

