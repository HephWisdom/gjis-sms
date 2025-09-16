"use client"
import { useEffect, useState } from 'react'
import { useRouter } from "next/navigation";
import { supabase } from '../../../lib/supabaseClient'

interface UserProfile {
  role: 'admin' | 'staff'
  full_name?: string
}

export default function Dashboard() {
  const [role, setRole] = useState<UserProfile['role'] | null>(null)
  const [fullName, setFullName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        const user = session?.user
        if (!user) {
          window.location.href = '/login'
          return
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setRole((data.role?.toLowerCase() as UserProfile['role']) ?? null)
          setFullName(data.full_name ?? '')
        } else {
          setRole(null)
        }
      } catch (err) {
        console.error('Error fetching role:', err)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return <p className="p-8 text-center">Loading...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome {fullName || ''}</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {role === 'admin' && <AdminView router={router} />}
      {role === 'staff' && <StaffView router={router} />}
      {!role && <p className="text-red-500">Role not found</p>}
    </div>
  )
}

function AdminView({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        title="Set Up Term"
        description="Set up a new academic term."
        onClick={() => router.push('/admin/reports')}
      />
      <Card
        title="Manage Students"
        description="Add, edit or remove students."
        onClick={() => router.push('/admin/students')}
      />
      <Card
        title="Manage Classes"
        description="Add or modify classes."
        onClick={() => router.push('/admin/classes')}
      />
      <Card
        title="Manage Staff"
        description="Create staff accounts or change roles."
        onClick={() => router.push('/admin/staff')}
      />
      <Card
        title="View Reports"
        description="View fees and attendance reports."
        onClick={() => router.push('/admin/report')}
      />
    </div>
  )
}

function StaffView({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        title="Scan Student QR"
        description="Record daily feeding and transport fees."
        onClick={() => router.push('/staff/qr-scan')}
      />
      <Card
        title="View Records"
        description="Check daily payment records."
        onClick={() => router.push('/staff/recorded')}
      />

    </div>
  )
}

function Card({
  title,
  description,
  onClick,
}: {
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
