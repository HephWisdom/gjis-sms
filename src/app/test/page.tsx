import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function TestPage() {
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    async function loadStudents() {
      let { data, error } = await supabase.from('students').select('*')
      if (error) console.error(error)
      else setStudents(data ?? [])
    }
    loadStudents()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Supabase Test</h1>
      <pre>{JSON.stringify(students, null, 2)}</pre>
    </div>
  )
}
