"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin/classes")
    })
  }, [router, supabase])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      // ✅ This automatically sets the auth cookie
      router.push("/admin/classes")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-4">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl p-6 sm:p-8 md:p-10 bg-white rounded-2xl shadow-2xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-center text-gray-800 mb-6">
          School System Login
        </h2>

        {error && (
          <p className="mb-4 text-red-500 text-sm sm:text-base text-center bg-red-100 p-2 rounded">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 sm:py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-md text-sm sm:text-base"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm md:text-base text-gray-500">
          © {new Date().getFullYear()} GJIS School System
        </p>
      </div>
    </div>
  )
}
