"use client"
import { useEffect, useState } from "react"
import { supabase } from "../../../../../lib/supabaseClient"

interface Class {
  id: number
  class_name: string
}

interface Student {
  id: number
  name: string
  classes?: {
    class_name: string
  } | null
}

interface Staff {
  id: string
  full_name: string
  role: string
}

interface SchoolFeeRecord {
  id: number
  amount: number
  date_paid: string
  student_id: number
  staff_id: string
  students: Student
  staff: Staff | null
}

interface Row {
  studentId: number
  studentName: string
  className: string
  totalFees: number
  amountPaid: number
  balance: number
  datePaid: string
  recordId: number
  latestAmount: number
  staffName: string
  staffRole: string
}

export default function SchoolFeesPage() {
  const [records, setRecords] = useState<SchoolFeeRecord[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<(Row & { mode: "edit" | "add" }) | null>(null)
  const [newAmount, setNewAmount] = useState<number>(0)

  const [selectedClass, setSelectedClass] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    fetchRecords()
    fetchClasses()
  }, [])

  async function fetchRecords() {
    setLoading(true)
    const { data, error } = await supabase
      .from("school_fees")
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
            class_name
          )
        ),
        staff:user_profiles!school_fees_staff_id_fkey (
          id,
          full_name,
          role
        )
      `)
      .order("date_paid", { ascending: false })

    if (error) {
      console.error("Error fetching records:", error)
      setRecords([])
    } else {
      // Transform the data so students and staff are objects, not arrays
      const transformed = (data as any[]).map((rec) => ({
        ...rec,
        students: Array.isArray(rec.students) ? rec.students[0] : rec.students,
        staff: Array.isArray(rec.staff) ? rec.staff[0] : rec.staff,
      }))
      setRecords(transformed)
    }

    setLoading(false)
  }

  async function fetchClasses() {
    const { data, error } = await supabase.from("classes").select("id, class_name")
    if (error) console.error("Error fetching classes:", error)
    else setClasses((data as Class[]) || [])
  }

  async function updatePayment(recordId: number, amount: number) {
    const { error } = await supabase.from("school_fees").update({ amount }).eq("id", recordId)

    if (error) {
      alert("Failed to update payment")
    } else {
      alert("Payment updated successfully")
      setEditingRecord(null)
      fetchRecords()
    }
  }

  async function addPayment(studentId: number, amount: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!studentId || !amount || !user?.id) {
      alert("Invalid student, amount, or staff")
      return
    }

    const { error } = await supabase.from("school_fees").insert([
      {
        student_id: studentId,
        amount,
        date_paid: new Date().toISOString(),
        staff_id: user.id,
      },
    ])

    if (error) {
      alert("Failed to add payment: " + error.message)
    } else {
      alert("Payment added successfully")
      setEditingRecord(null)
      fetchRecords()
    }
  }

  const rows: Row[] = records.map((payment) => {
    const student = payment.students
    const schoolFee = 7 // fixed fee per day

    return {
      studentId: student.id,
      studentName: student.name,
      className: student.classes?.class_name || "—",
      totalFees: schoolFee,
      amountPaid: payment.amount,
      balance: schoolFee - payment.amount,
      datePaid: payment.date_paid,
      recordId: payment.id,
      latestAmount: payment.amount,
      staffName: payment.staff?.full_name || "—",
      staffRole: payment.staff?.role || "—",
    }
  })

  const filteredRecords = rows.filter((r) => {
    const classMatch = selectedClass === "all" || r.className === selectedClass
    let dateMatch = true
    if (startDate) dateMatch = new Date(r.datePaid) >= new Date(startDate)
    if (endDate) dateMatch = dateMatch && new Date(r.datePaid) <= new Date(endDate)
    return classMatch && dateMatch
  })

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">
        School Fees Records (₵7 per day)
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm w-full"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 border rounded-lg shadow-sm w-full"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-3">Student</th>
              <th className="p-3">Class</th>
              <th className="p-3">Total Fees</th>
              <th className="p-3">Amount Paid</th>
              <th className="p-3">Balance</th>
              <th className="p-3">Date Paid</th>
              <th className="p-3">Staff</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => (
              <tr key={r.recordId} className="border-b">
                <td className="p-3">{r.studentName}</td>
                <td className="p-3">{r.className}</td>
                <td className="p-3">₵{r.totalFees}</td>
                <td className="p-3">₵{r.amountPaid}</td>
                <td className="p-3">₵{r.balance}</td>
                <td className="p-3">{new Date(r.datePaid).toLocaleDateString()}</td>
                <td className="p-3">
                  {r.staffName} ({r.staffRole})
                </td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      setEditingRecord({ ...r, mode: "edit" })
                    }
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setEditingRecord({ ...r, mode: "add" })
                    }
                    className="ml-2 bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-4">
        {filteredRecords.map((r) => (
          <div
            key={r.recordId}
            className="bg-white p-4 rounded-lg shadow space-y-2"
          >
            <p>
              <strong>Student:</strong> {r.studentName}
            </p>
            <p>
              <strong>Class:</strong> {r.className}
            </p>
            <p>
              <strong>Total Fees:</strong> ₵{r.totalFees}
            </p>
            <p>
              <strong>Amount Paid:</strong> ₵{r.amountPaid}
            </p>
            <p>
              <strong>Balance:</strong> ₵{r.balance}
            </p>
            <p>
              <strong>Date Paid:</strong>{" "}
              {new Date(r.datePaid).toLocaleDateString()}
            </p>
            <p>
              <strong>Staff:</strong> {r.staffName} ({r.staffRole})
            </p>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() =>
                  setEditingRecord({ ...r, mode: "edit" })
                }
                className="bg-blue-500 text-white px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() =>
                  setEditingRecord({ ...r, mode: "add" })
                }
                className="bg-green-500 text-white px-2 py-1 rounded"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Form */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingRecord.mode === "edit"
                ? "Edit Payment"
                : "Add Payment"}
            </h2>
            <p className="mb-2">
              <strong>Student:</strong> {editingRecord.studentName}
            </p>
            <input
              type="number"
              value={newAmount || editingRecord.latestAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingRecord.mode === "edit") {
                    updatePayment(editingRecord.recordId, newAmount)
                  } else {
                    addPayment(editingRecord.studentId, newAmount)
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {editingRecord.mode === "edit" ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
