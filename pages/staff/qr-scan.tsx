"use client"

import { useState, useEffect } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"
import { supabase } from "../../lib/supabaseClient"

export default function ScanStudentBarcode() {
  const [scannedCode, setScannedCode] = useState("")
  const [student, setStudent] = useState<any>(null)
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

  // QR Scanner
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scanner.render(
        async (decodedText) => {
          if (decodedText !== scannedCode) {
            setScannedCode(decodedText)
            await fetchStudent(decodedText)
            await scanner?.clear()
            setIsScanning(false)
          }
        },
        (err) => {
          if (err !== "NotFoundException") console.error("Scan error:", err)
        }
      )
    }
    return () => {
      scanner?.clear().catch(() => {})
    }
  }, [isScanning])

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
      setStudent(data)
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
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          🎯 Scan Student Code
        </h1>

        {/* Scanner */}
        {!isScanning ? (
          <button
            onClick={() => setIsScanning(true)}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
          >
            Start Scanning
          </button>
        ) : (
          <p className="text-center text-gray-600 mb-2">
            📸 Point the camera at the QR code...
          </p>
        )}

        <div
          id="reader"
          className={`mx-auto w-72 h-72 border-2 border-gray-300 rounded-lg shadow-md mb-4 ${
            !isScanning ? "hidden" : ""
          }`}
        ></div>

        {/* Status messages */}
        {scannedCode && (
          <p className="text-center text-sm text-gray-700 mb-2">
            Scanned Code: <b>{scannedCode}</b>
          </p>
        )}
        {errorMsg && (
          <p className="text-red-600 text-center font-medium mb-2">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="text-green-600 text-center font-medium mb-2">
            {successMsg}
          </p>
        )}

        {/* Student Card */}
        {student && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-5">
            <h2 className="text-lg font-bold mb-2 text-gray-800">
              Student Details
            </h2>
            <p className="text-gray-700">
              <b>Name:</b> {student.name}
            </p>
            <p className="text-gray-700">
              <b>Class:</b> {student.classes?.class_name}
            </p>
            <p className="text-gray-700 mb-4">
              <b>Code:</b> {student.student_code}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handlePayment("feeding")}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 disabled:opacity-50 transition"
              >
                🍲 Pay Feeding (GHS 6)
              </button>
              <button
                onClick={() => handlePayment("transport")}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 disabled:opacity-50 transition"
              >
                🚌 Pay Transport (GHS 6)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
