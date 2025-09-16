import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function SchoolFeesPage() {
  const [records, setRecords] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [newAmount, setNewAmount] = useState<number>(0)

  const [selectedClass, setSelectedClass] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all') // all | paid | owing

  useEffect(() => {
    fetchRecords()
    fetchClasses()
  }, [])

  async function fetchRecords() {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        classes:class_id (
          class_name,
          set_school_fees
        ),
        school_fees (
          id,
          amount,
          date_paid,
          staff:user_profiles (
            id,
            full_name,
            role
          )
        )
      `)
      .order('date_paid', { foreignTable: 'school_fees', ascending: false })

    if (error) console.error('Error fetching records:', error)
    else setRecords(data || [])

    setLoading(false)
  }

  async function fetchClasses() {
    const { data, error } = await supabase.from('classes').select('id, class_name')
    if (error) console.error('Error fetching classes:', error)
    else setClasses(data || [])
  }

  async function updatePayment(recordId: number, amount: number) {
    const { error } = await supabase
      .from('school_fees')
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
    if (!studentId || !amount) {
      alert('Invalid student or amount')
      return
    }

    const user = (await supabase.auth.getUser()).data.user

    const { error } = await supabase.from('school_fees').insert([
      {
        student_id: studentId,
        amount,
        date_paid: new Date().toISOString(),
        staff_id: user?.id,
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

  // Flatten records
  const rows = records.map((student) => {
    const total = student.classes?.set_school_fees || 0
    const paid =
      student.school_fees?.reduce(
        (sum: number, f: { amount: number }) => sum + f.amount,
        0
      ) || 0
    const balance = total - paid
    const latestPayment = student.school_fees?.[0] || null

    return {
      studentId: student.id,
      studentName: student.name,
      className: student.classes?.class_name || '—',
      totalFees: total,
      amountPaid: paid,
      balance,
      datePaid: latestPayment ? latestPayment.date_paid : null,
      recordId: latestPayment ? latestPayment.id : null,
      staffName: latestPayment?.staff?.full_name || '—',
      staffRole: latestPayment?.staff?.role || '—',
      latestAmount: latestPayment?.amount || 0,
    }
  })

  const filteredRecords = rows.filter((r) => {
    let statusMatch = true
    if (paymentStatus === 'paid') statusMatch = r.balance === 0
    if (paymentStatus === 'owing') statusMatch = r.balance > 0
    let classMatch = selectedClass === 'all' || r.className === selectedClass
    return statusMatch && classMatch
  })

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">School Fees Records</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm w-full"
        >
          <option value="all">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.class_name}>
              {c.class_name}
            </option>
          ))}
        </select>

        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm w-full"
        >
          <option value="all">All Status</option>
          <option value="paid">Fully Paid</option>
          <option value="owing">Owing</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredRecords.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <>
          {/* Desktop = Table */}
          <div className="hidden sm:block overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full border-collapse text-sm sm:text-base">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Class</th>
                  <th className="px-4 py-2 text-left">Total Fees</th>
                  <th className="px-4 py-2 text-left">Amount Paid</th>
                  <th className="px-4 py-2 text-left">Balance</th>
                  <th className="px-4 py-2 text-left">Latest Date Paid</th>
                  <th className="px-4 py-2 text-left">Recorded By</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.studentId} className="border-t">
                    <td className="px-4 py-2">{r.studentName}</td>
                    <td className="px-4 py-2">{r.className}</td>
                    <td className="px-4 py-2">₵{r.totalFees.toLocaleString()}</td>
                    <td className="px-4 py-2">₵{r.amountPaid.toLocaleString()}</td>
                    <td
                      className={`px-4 py-2 font-semibold ${
                        r.balance === 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ₵{r.balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {r.datePaid ? new Date(r.datePaid).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {r.staffName} ({r.staffRole})
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      {r.datePaid &&
                      new Date(r.datePaid).toDateString() ===
                        new Date().toDateString() ? (
                        <button
                          onClick={() => {
                            setEditingRecord({ ...r, mode: 'edit' })
                            setNewAmount(r.latestAmount)
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
                        Add Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile = Card view */}
          <div className="sm:hidden space-y-4">
            {filteredRecords.map((r) => (
              <div key={r.studentId} className="bg-white shadow rounded-lg p-4">
                <h2 className="text-lg font-semibold">{r.studentName}</h2>
                <p className="text-gray-600">Class: {r.className}</p>
                <p>Total Fees: ₵{r.totalFees.toLocaleString()}</p>
                <p>Paid: ₵{r.amountPaid.toLocaleString()}</p>
                <p
                  className={`font-semibold ${
                    r.balance === 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  Balance: ₵{r.balance.toLocaleString()}
                </p>
                <p>Date: {r.datePaid ? new Date(r.datePaid).toLocaleDateString() : '—'}</p>
                <p>
                  Staff: {r.staffName} ({r.staffRole})
                </p>
                <div className="mt-3 flex gap-2">
                  {r.datePaid &&
                  new Date(r.datePaid).toDateString() ===
                    new Date().toDateString() ? (
                    <button
                      onClick={() => {
                        setEditingRecord({ ...r, mode: 'edit' })
                        setNewAmount(r.latestAmount)
                      }}
                      className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  ) : (
                    <span className="flex-1 text-gray-400 italic">Locked</span>
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
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {editingRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 sm:w-96">
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
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  editingRecord.mode === 'edit'
                    ? updatePayment(editingRecord.recordId, newAmount)
                    : addPayment(editingRecord.studentId, newAmount)
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto"
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
