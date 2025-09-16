import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

interface Class {
  id: string
  class_name: string
  set_feeding_fees: number
  set_transport_fees: number
  set_school_fees: number
}

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([])
  const [newClass, setNewClass] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  async function fetchClasses() {
    setLoading(true)
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('class_name')
    if (error) {
      console.error(error)
    } else {
      setClasses(data || [])
    }
    setLoading(false)
  }

  async function addClass() {
    if (!newClass.trim()) return
    const { error } = await supabase.from('classes').insert([
      {
        class_name: newClass.trim(),
        set_feeding_fees: 6,
        set_transport_fees: 6,
        set_school_fees: 0,
      },
    ])
    if (error) {
      alert('Error adding class: ' + error.message)
    } else {
      setNewClass('')
      fetchClasses()
    }
  }

  async function updateClass(id: string, field: string, value: number) {
    const { error } = await supabase
      .from('classes')
      .update({ [field]: value })
      .eq('id', id)

    if (error) {
      alert('Error updating: ' + error.message)
    } else {
      fetchClasses()
    }
  }

  async function deleteClass(id: string) {
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) {
      alert('Error deleting class: ' + error.message)
    } else {
      fetchClasses()
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Classes</h1>

      {/* Add new class */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter new class name"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
          className="flex-1 px-4 py-2 rounded border"
        />
        <button
          onClick={addClass}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      {/* Table of classes */}
      {loading ? (
        <p>Loading...</p>
      ) : classes.length === 0 ? (
        <p>No classes yet.</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded shadow">
            <div className="grid grid-cols-5 font-semibold bg-gray-200 px-4 py-2">
              <span>Class</span>
              <span>Feeding Fee (₵)</span>
              <span>Transport Fee (₵)</span>
              <span>School Fee (₵)</span>
              <span>Action</span>
            </div>
            <ul className="divide-y">
              {classes.map((cls) => (
                <li
                  key={cls.id}
                  className="grid grid-cols-5 items-center px-4 py-2 hover:bg-gray-50"
                >
                  <span>{cls.class_name}</span>

                  <input
                    type="number"
                    value={cls.set_feeding_fees}
                    onChange={(e) =>
                      updateClass(cls.id, 'set_feeding_fees', Number(e.target.value))
                    }
                    className="w-24 px-2 py-1 border rounded"
                  />

                  <input
                    type="number"
                    value={cls.set_transport_fees}
                    onChange={(e) =>
                      updateClass(cls.id, 'set_transport_fees', Number(e.target.value))
                    }
                    className="w-24 px-2 py-1 border rounded"
                  />

                  <input
                    type="number"
                    value={cls.set_school_fees}
                    onChange={(e) =>
                      updateClass(cls.id, 'set_school_fees', Number(e.target.value))
                    }
                    className="w-24 px-2 py-1 border rounded"
                  />

                  <button
                    onClick={() => deleteClass(cls.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-lg shadow p-4 space-y-2"
              >
                <p><span className="font-semibold">Class:</span> {cls.class_name}</p>

                <div>
                  <label className="block text-sm font-medium">Feeding Fee (₵)</label>
                  <input
                    type="number"
                    value={cls.set_feeding_fees}
                    onChange={(e) =>
                      updateClass(cls.id, 'set_feeding_fees', Number(e.target.value))
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Transport Fee (₵)</label>
                  <input
                    type="number"
                    value={cls.set_transport_fees}
                    onChange={(e) =>
                      updateClass(cls.id, 'set_transport_fees', Number(e.target.value))
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">School Fee (₵)</label>
                  <input
                    type="number"
                    value={cls.set_school_fees}
                    onChange={(e) =>
                      updateClass(cls.id, 'set_school_fees', Number(e.target.value))
                    }
                    className="w-full px-2 py-1 border rounded"
                  />
                </div>

                <button
                  onClick={() => deleteClass(cls.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
