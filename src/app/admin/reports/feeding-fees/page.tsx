"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../../../../lib/supabaseClient'

/* ========= Type Definitions ========= */
interface Class {
  id: number
  class_name: string
  set_feeding_fees?: number
}

interface Student {
  id: number
  name: string
  classes?: Class
}

interface Staff {
  id: string
  full_name: string
  role: string
}

interface FeedingFeeRecord {
  id: number
  amount: number
  date_paid: string
  student_id: number
  staff_id: string
  students: Student
  staff?: Staff
}

interface RowData {
  recordId: number
  studentId: number
  studentName: string
  className: string
  totalFees: number
  amountPaid: number
  balance: number
  datePaid: string
  staffName: string
  staffRole: string
}

export default function FeedingFeesPage() {
  const [records, setRecords] = useState<FeedingFeeRecord[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<(RowData & { mode: 'edit' | 'add' }) | null>(null)
  const [newAmount, setNewAmount] = useState<number>(0)

  const [selectedClass, setSelectedClass] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchRecords()
    fetchClasses()
  }, [])

  async function fetchRecords() {
    setLoading(true)
    const { data, error } = await supabase
      .from('feeding_fees')
      .select(`
        id,
        amount,
        date_paid,
        student_id,
        staff_id,
        students (
          id,
          name,
          classes:class_id (
            class_name,
            set_feeding_fees
          )
        ),
        staff:user_profiles!feeding_fees_staff_id_fkey (
          id,
          full_name,
          role
        )
      `)
      .order('date_paid', { ascending: false })

    if (error) {
      console.error('Error fetching records:', error)
      setRecords([])
    } else {
      setRecords(
        (Array.isArray(data)
          ? data.map((item: any) => ({
              ...item,
              students: Array.isArray(item.students) ? item.students[0] : item.students,
              staff: Array.isArray(item.staff) ? item.staff[0] : item.staff,
            }))
          : []) as FeedingFeeRecord[]
      )
    }
    setLoading(false)
  }

  async function fetchClasses() {
    const { data, error } = await supabase.from('classes').select('id, class_name')
    if (error) console.error('Error fetching classes:', error)
    else setClasses((data as Class[]) || [])
  }

  async function updatePayment(recordId: number, amount: number) {
    const { error } = await supabase
      .from('feeding_fees')
      .update({ amount })
      .eq('id', recordId)

    if (error) {
      console.error('Error updating payment:', error)
      alert('Failed to update payment')
    } else {
      alert('Payment updated successfully')
      setEditingRecord(null)
      fetchRecords()
    }
  }

  async function addPayment(studentId: number, amount: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!studentId || !amount || !user?.id) {
      alert('Invalid student, amount, or staff')
      return
    }

    const { error } = await supabase.from('feeding_fees').insert([
      {
        student_id: studentId,
        amount,
        date_paid: new Date().toISOString(),
        staff_id: user.id,
      },
    ])

    if (error) {
      console.error('Error adding payment:', error.message)
      alert('Failed to add payment: ' + error.message)
    } else {
      alert('Payment added successfully')
      setEditingRecord(null)
      fetchRecords()
    }
  }

  // Flatten rows
  const rows: RowData[] = records.map((payment) => {
    const student = payment.students
    const total = student.classes?.set_feeding_fees || 0

    return {
      recordId: payment.id,
      studentId: student.id,
      studentName: student.name,
      className: student.classes?.class_name || '—',
      totalFees: total,
      amountPaid: payment.amount,
      balance: total - payment.amount,
      datePaid: payment.date_paid,
      staffName: payment.staff?.full_name || '—',
      staffRole: payment.staff?.role || '—',
    }
  })

  // Filters
  const filteredRecords = rows.filter((r) => {
    const classMatch = selectedClass === 'all' || r.className === selectedClass
    let dateMatch = true
    if (startDate) dateMatch = new Date(r.datePaid) >= new Date(startDate)
    if (endDate) dateMatch = dateMatch && new Date(r.datePaid) <= new Date(endDate)
    return classMatch && dateMatch
  })

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Feeding Fees Records</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6 items-center">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm w-full sm:w-auto"
        >
          <option value="all">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.class_name}>
              {c.class_name}
            </option>
          ))}
        </select>

        <div className="flex gap-2 items-center w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg flex-1"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg flex-1"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredRecords.length === 0 ? (
        <p>No feeding fee payments found.</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Class</th>
                  <th className="px-4 py-2 text-left">Total Fees</th>
                  <th className="px-4 py-2 text-left">Amount Paid</th>
                  <th className="px-4 py-2 text-left">Balance</th>
                  <th className="px-4 py-2 text-left">Date Paid</th>
                  <th className="px-4 py-2 text-left">Recorded By</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const isToday =
                    r.datePaid &&
                    new Date(r.datePaid).toDateString() === new Date().toDateString()
                  return (
                    <tr key={r.recordId} className="border-t">
                      <td className="px-4 py-2">{r.studentName}</td>
                      <td className="px-4 py-2">{r.className}</td>
                      <td className="px-4 py-2">₵{r.totalFees}</td>
                      <td className="px-4 py-2">₵{r.amountPaid}</td>
                      <td
                        className={`px-4 py-2 font-semibold ${
                          r.balance === 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ₵{r.balance}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(r.datePaid).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {r.staffName} ({r.staffRole})
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        {isToday ? (
                          <button
                            onClick={() => {
                              setEditingRecord({ ...r, mode: 'edit' })
                              setNewAmount(r.amountPaid || 0)
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="text-gray-400 italic">Locked</span>
                        )}
                        <button
                          onClick={() => {
                            setEditingRecord({ ...r, mode: 'add' })
                            setNewAmount(0)
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {filteredRecords.map((r) => {
              const isToday =
                r.datePaid &&
                new Date(r.datePaid).toDateString() === new Date().toDateString()
              return (
                <div
                  key={r.recordId}
                  className="bg-white rounded-lg shadow p-4 text-sm"
                >
                  <p><span className="font-semibold">Student:</span> {r.studentName}</p>
                  <p><span className="font-semibold">Class:</span> {r.className}</p>
                  <p><span className="font-semibold">Total Fees:</span> ₵{r.totalFees}</p>
                  <p><span className="font-semibold">Paid:</span> ₵{r.amountPaid}</p>
                  <p className={r.balance === 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    Balance: ₵{r.balance}
                  </p>
                  <p><span className="font-semibold">Date:</span> {new Date(r.datePaid).toLocaleDateString()}</p>
                  <p><span className="font-semibold">By:</span> {r.staffName} ({r.staffRole})</p>
                  <div className="mt-3 flex gap-2">
                    {isToday ? (
                      <button
                        onClick={() => {
                          setEditingRecord({ ...r, mode: 'edit' })
                          setNewAmount(r.amountPaid || 0)
                        }}
                        className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">Locked</span>
                    )}
                    <button
                      onClick={() => {
                        setEditingRecord({ ...r, mode: 'add' })
                        setNewAmount(0)
                      }}
                      className="flex-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Edit/Add Modal */}
      {editingRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingRecord.mode === 'edit'
                ? `Edit Payment for ${editingRecord.studentName}`
                : `Add Payment for ${editingRecord.studentName}`}
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
                  editingRecord.mode === 'edit'
                    ? updatePayment(editingRecord.recordId, newAmount)
                    : addPayment(editingRecord.studentId, newAmount)
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
