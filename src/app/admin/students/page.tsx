"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'

interface Student {
  id: number
  student_id: string
  name: string
  class_id: number
  class_name?: string
  parent_contact: string
  created_at?: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState<string>('')
  const [classes, setClasses] = useState<{ id: number; class_name: string }[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    class_id: '',
    parent_contact: '',
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('id', { ascending: false })

      if (studentsError) throw studentsError

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, class_name')

      if (classesError) throw classesError

      setClasses(classesData || [])

      const classMap: Record<number, string> = {}
      classesData?.forEach((c) => {
        classMap[c.id] = c.class_name
      })

      const merged =
        studentsData?.map((s) => ({
          ...s,
          class_name: classMap[s.class_id] || '—',
        })) || []

      setStudents(merged)
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }

  async function handleSave() {
    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            student_id: formData.student_id,
            name: formData.name,
            class_id: Number(formData.class_id),
            parent_contact: formData.parent_contact,
          })
          .eq('id', editingStudent.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('students').insert([
          {
            student_id: formData.student_id,
            name: formData.name,
            class_id: Number(formData.class_id),
            parent_contact: formData.parent_contact,
          },
        ])

        if (error) throw error
      }

      setShowForm(false)
      setEditingStudent(null)
      setFormData({ student_id: '', name: '', class_id: '', parent_contact: '' })
      fetchStudents()
    } catch (err) {
      console.error('Error saving student:', err)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
      fetchStudents()
    } catch (err) {
      console.error('Error deleting student:', err)
    }
  }

  function exportCSV() {
    const headers = ['Student ID', 'Name', 'Class', 'Parent Contact']
    const rows = students.map((s) => [
      s.student_id,
      s.name,
      s.class_name || '',
      s.parent_contact,
    ])

    let csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((e) => e.join(',')).join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'students.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.parent_contact.toLowerCase().includes(search.toLowerCase())
    const matchesClass = filterClass ? s.class_id.toString() === filterClass : true
    return matchesSearch && matchesClass
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Manage Students</h1>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or contact"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 flex-1"
        />

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.class_name}
            </option>
          ))}
        </select>

        <button
          onClick={exportCSV}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Export CSV
        </button>

        <button
          onClick={() => {
            setEditingStudent(null)
            setFormData({ student_id: '', name: '', class_id: '', parent_contact: '' })
            setShowForm(true)
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Add Student
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white shadow-md rounded p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingStudent ? 'Edit Student' : 'Add Student'}
          </h2>
          <input
            type="text"
            placeholder="Student ID"
            value={formData.student_id}
            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            className="border rounded p-2 mb-2 w-full"
          />
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border rounded p-2 mb-2 w-full"
          />
          <select
            value={formData.class_id}
            onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
            className="border rounded p-2 mb-2 w-full"
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.class_name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Parent Contact"
            value={formData.parent_contact}
            onChange={(e) =>
              setFormData({ ...formData, parent_contact: e.target.value })
            }
            className="border rounded p-2 mb-2 w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingStudent(null)
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Student ID</th>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Class</th>
              <th className="py-3 px-4 text-left">Parent Contact</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{student.student_id}</td>
                <td className="py-2 px-4">{student.name}</td>
                <td className="py-2 px-4">{student.class_name}</td>
                <td className="py-2 px-4">{student.parent_contact}</td>
                <td className="py-2 px-4 text-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingStudent(student)
                      setFormData({
                        student_id: student.student_id,
                        name: student.name,
                        class_id: student.class_id.toString(),
                        parent_contact: student.parent_contact,
                      })
                      setShowForm(true)
                    }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <p>
              <span className="font-semibold">ID:</span> {student.student_id}
            </p>
            <p>
              <span className="font-semibold">Name:</span> {student.name}
            </p>
            <p>
              <span className="font-semibold">Class:</span> {student.class_name}
            </p>
            <p>
              <span className="font-semibold">Parent Contact:</span>{' '}
              {student.parent_contact}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setEditingStudent(student)
                  setFormData({
                    student_id: student.student_id,
                    name: student.name,
                    class_id: student.class_id.toString(),
                    parent_contact: student.parent_contact,
                  })
                  setShowForm(true)
                }}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(student.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
