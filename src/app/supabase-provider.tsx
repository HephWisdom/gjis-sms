"use client"

import { useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        // Only refresh when the user actually logs in/out
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return <>{children}</>
}
