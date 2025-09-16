"use client"
import { useState, useEffect } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "../../../../lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"

// ✅ Define a Student type instead of using `any`
type Student = {
  id: string
  student_code: string
  name: string
  classes?: {
    class_name: string
  } | null
}

export default function ScanStudentBarcode() {
  const [scannedCode, setScannedCode] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [staffId, setStaffId] = useState<string | null>(null)

  // 🔑 Get logged-in staff ID
  useEffect(() => {
    const fetchStaff = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setStaffId(user.id)
    }
    fetchStaff()
  }, [])

  // QR Scanner setup
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scanner.render(
        async (decodedText: string) => {
          if (decodedText !== scannedCode) {
            setScannedCode(decodedText)
            await fetchStudent(decodedText)
            await scanner?.clear()
            setIsScanning(false)
          }
        },
        (err: unknown) => {
          if (
            !(typeof err === "string" && err === "NotFoundException") &&
            !((err as { name?: string })?.name === "NotFoundException")
          ) {
            console.error("QR Scan error:", (err as Error).message || err)
          }
        }
      )
    }
    return () => {
      scanner?.clear().catch(() => {})
    }
  }, [isScanning, scannedCode]) // ✅ fixed dependency

  // Fetch student info
  async function fetchStudent(code: string) {
    setErrorMsg("")
    setStudent(null)
    setSuccessMsg("")

    const { data, error } = await supabase
      .from("students")
      .select(
        `
        id,
        student_code,
        name,
        classes:class_id (
          class_name
        )
      `
      )
      .eq("student_code", code)
      .single()

    if (error) {
      setErrorMsg("⚠️ Student not found")
    } else {
      // Transform classes array to single object or null
      const studentData = {
        id: data.id,
        student_code: data.student_code,
        name: data.name,
        classes: Array.isArray(data.classes) && data.classes.length > 0
          ? { class_name: data.classes[0].class_name }
          : null,
      }
      setStudent(studentData)
    }
  }

  // Record payment
  async function handlePayment(type: "feeding" | "transport") {
    if (!student || !staffId) {
      setErrorMsg("⚠️ Staff not authenticated or student missing")
      return
    }

    setLoading(true)
    setSuccessMsg("")
    setErrorMsg("")

    const table = type === "feeding" ? "feeding_fees" : "transport_fees"
    const amount = 6
    const today = new Date().toISOString().split("T")[0]

    // Check duplicate
    const { data: existing } = await supabase
      .from(table)
      .select("id")
      .eq("student_id", student.id)
      .eq("date", today)
      .maybeSingle()

    if (existing) {
      setErrorMsg(`⚠️ ${student.name} already paid ${type} fees today.`)
      setLoading(false)
      return
    }

    const { error } = await supabase.from(table).insert({
      student_id: student.id,
      staff_id: staffId,
      amount,
      date: today,
    })

    if (error) {
      setErrorMsg("❌ Failed to record payment")
    } else {
      setSuccessMsg(`✅ ${type} fee of GHS ${amount} recorded successfully!`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
          🎯 Scan Student Code
        </h1>

        {/* Scanner */}
        {!isScanning ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsScanning(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition"
          >
            🚀 Start Scanning
          </motion.button>
        ) : (
          <p className="text-center text-gray-600 mt-2">
            📸 Point the camera at the QR code...
          </p>
        )}

        <AnimatePresence>
          {isScanning && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center mt-4"
            >
              <div
                id="reader"
                className="w-72 h-72 border-4 border-blue-400 rounded-xl shadow-lg"
              ></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status messages */}
        {scannedCode && (
          <p className="text-center text-sm text-gray-700 mt-3">
            ✅ Scanned Code: <b>{scannedCode}</b>
          </p>
        )}
        {errorMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-center font-medium mt-3"
          >
            {errorMsg}
          </motion.p>
        )}
        {successMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600 text-center font-medium mt-3"
          >
            {successMsg}
          </motion.p>
        )}

        {/* Student Card */}
        {student && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-6 bg-white rounded-2xl shadow-xl p-6 border"
          >
            <h2 className="text-xl font-bold mb-3 text-gray-800">
              🧑‍🎓 Student Details
            </h2>
            <div className="space-y-1 text-gray-700">
              <p>
                <b>Name:</b> {student.name}
              </p>
              <p>
                <b>Class:</b> {student.classes?.class_name}
              </p>
              <p>
                <b>Code:</b> {student.student_code}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePayment("feeding")}
                disabled={loading}
                className="px-4 py-3 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loading ? "⏳ Processing..." : "🍲 Pay Feeding (GHS 6)"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePayment("transport")}
                disabled={loading}
                className="px-4 py-3 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {loading ? "⏳ Processing..." : "🚌 Pay Transport (GHS 6)"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
