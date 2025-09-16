"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"

interface Staff {
  id: string
  email: string
  full_name: string
  role: "admin" | "staff"
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaff()
  }, [])

  async function fetchStaff() {
    setLoading(true)
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, full_name, role")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
    } else {
      const users = await supabase.auth.admin.listUsers()
      const merged = (data || []).map((profile) => {
        const user = users.data.users.find((u) => u.id === profile.id)
        return {
          ...profile,
          email: user?.email || "—",
        }
      })
      setStaff(merged)
    }
    setLoading(false)
  }

  async function addStaff() {
    if (!newEmail.trim() || !newName.trim()) return

    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(newEmail)

    if (inviteError) {
      alert("Error creating user: " + inviteError.message)
      return
    }

    const userId = inviteData.user?.id
    if (!userId) {
      alert("User not created properly.")
      return
    }

    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert([{ id: userId, full_name: newName.trim(), role: newRole }])

    if (profileError) {
      alert("Error creating profile: " + profileError.message)
    } else {
      setNewEmail("")
      setNewName("")
      setNewRole("staff")
      fetchStaff()
    }
  }

  async function deleteStaff(id: string) {
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) {
      alert("Error deleting auth user: " + authError.message)
      return
    }
    fetchStaff()
  }

  async function changeRole(id: string, newRole: "admin" | "staff") {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("id", id)
      .select("id, full_name, role")

    if (error) {
      alert("Error updating role: " + error.message)
    } else {
      console.log("Updated role:", data)
      fetchStaff()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Staff</h1>

      {/* Add new staff */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          type="email"
          placeholder="Enter staff email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="w-full px-4 py-2 rounded border"
        />
        <input
          type="text"
          placeholder="Full name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-4 py-2 rounded border"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as "admin" | "staff")}
          className="w-full px-3 py-2 rounded border"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={addStaff}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      {/* Staff List */}
      {loading ? (
        <p>Loading...</p>
      ) : staff.length === 0 ? (
        <p>No staff members yet.</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded shadow overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-200 text-sm sm:text-base">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-t hover:bg-gray-50 text-sm sm:text-base">
                    <td className="px-4 py-2">{member.full_name}</td>
                    <td className="px-4 py-2 break-words">{member.email}</td>
                    <td className="px-4 py-2 capitalize">{member.role}</td>
                    <td className="px-4 py-2 flex flex-col sm:flex-row gap-2">
                      {member.role === "staff" ? (
                        <button
                          onClick={() => changeRole(member.id, "admin")}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Promote
                        </button>
                      ) : (
                        <button
                          onClick={() => changeRole(member.id, "staff")}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Demote
                        </button>
                      )}
                      <button
                        onClick={() => deleteStaff(member.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {staff.map((member) => (
              <div
                key={member.id}
                className="border rounded-lg p-4 shadow-sm bg-white"
              >
                <p><span className="font-semibold">Name:</span> {member.full_name}</p>
                <p><span className="font-semibold">Email:</span> {member.email}</p>
                <p><span className="font-semibold">Role:</span> {member.role}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {member.role === "staff" ? (
                    <button
                      onClick={() => changeRole(member.id, "admin")}
                      className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => changeRole(member.id, "staff")}
                      className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Demote to Staff
                    </button>
                  )}
                  <button
                    onClick={() => deleteStaff(member.id)}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
