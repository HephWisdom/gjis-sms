'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

// Define record shape
interface RecordRow {
  recordId: number
  studentName: string
  className: string
  amountPaid: number
  datePaid: string
  type: 'Transport' | 'Feeding'
}

export default function StaffRecordsPage() {
  const [records, setRecords] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<RecordRow | null>(null)
  const [newAmount, setNewAmount] = useState<number>(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (userId) fetchRecords()
  }, [userId])

  async function getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error fetching user:', error)
      return
    }
    setUserId(data.user?.id || null)
  }

  async function fetchRecords() {
    setLoading(true)

    // Transport fees
    const { data: transportData, error: transportError } = await supabase
      .from('transport_fees')
      .select(`
        id,
        amount,
        date_paid,
        students (
          id,
          name,
          classes:class_id (
            class_name
          )
        )
      `)
      .eq('staff_id', userId)
      .order('date_paid', { ascending: false })

    // Feeding fees
    const { data: feedingData, error: feedingError } = await supabase
      .from('feeding_fees')
      .select(`
        id,
        amount,
        date_paid,
        students (
          id,
          name,
          classes:class_id (
            class_name
          )
        )
      `)
      .eq('staff_id', userId)
      .order('date_paid', { ascending: false })

    if (transportError) console.error('Transport fetch error:', transportError)
    if (feedingError) console.error('Feeding fetch error:', feedingError)

    // Normalize and combine
    const transport: RecordRow[] = (transportData || []).map((r: any) => ({
      recordId: r.id,
      studentName: r.students?.name || '—',
      className: r.students?.classes?.class_name || '—',
      amountPaid: r.amount,
      datePaid: r.date_paid,
      type: 'Transport',
    }))

    const feeding: RecordRow[] = (feedingData || []).map((r: any) => ({
      recordId: r.id,
      studentName: r.students?.name || '—',
      className: r.students?.classes?.class_name || '—',
      amountPaid: r.amount,
      datePaid: r.date_paid,
      type: 'Feeding',
    }))

    // Merge and sort
    const merged = [...transport, ...feeding].sort(
      (a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()
    )

    setRecords(merged)
    setLoading(false)
  }

  async function updatePayment(recordId: number, amount: number, type: 'Transport' | 'Feeding') {
    const table = type === 'Transport' ? 'transport_fees' : 'feeding_fees'

    const { error } = await supabase
      .from(table)
      .update({ amount })
      .eq('id', recordId)
      .eq('staff_id', userId) // staff can only update their own

    if (error) {
      console.error('Error updating payment:', error)
      alert('Failed to update payment')
    } else {
      alert('Payment updated successfully')
      setEditingRecord(null)
      fetchRecords()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">My Daily Records</h1>

      {loading ? (
        <p>Loading...</p>
      ) : records.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Student</th>
                <th className="px-4 py-2 text-left">Class</th>
                <th className="px-4 py-2 text-left">Fee Type</th>
                <th className="px-4 py-2 text-left">Amount Paid</th>
                <th className="px-4 py-2 text-left">Date Paid</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const isToday =
                  r.datePaid &&
                  new Date(r.datePaid).toDateString() === new Date().toDateString()

                return (
                  <tr key={`${r.type}-${r.recordId}`} className="border-t">
                    <td className="px-4 py-2">{r.studentName}</td>
                    <td className="px-4 py-2">{r.className}</td>
                    <td className="px-4 py-2">{r.type}</td>
                    <td className="px-4 py-2">₵{r.amountPaid}</td>
                    <td className="px-4 py-2">
                      {r.datePaid ? new Date(r.datePaid).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {isToday ? (
                        <button
                          onClick={() => {
                            setEditingRecord(r)
                            setNewAmount(r.amountPaid || 0)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">Recorded</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">
              Edit {editingRecord.type} Payment for {editingRecord.studentName}
            </h2>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updatePayment(editingRecord.recordId, newAmount, editingRecord.type)
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
