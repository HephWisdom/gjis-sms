import { useRouter } from 'next/router'

export default function ReportsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Reports & Records</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard
          title="School Fees"
          description="View school fees payments and balances."
          onClick={() => router.push('/admin/reports/school-fees')}
        />
        <ReportCard
          title="Feeding Fees"
          description="Track daily feeding payments."
          onClick={() => router.push('/admin/reports/feeding-fees')}
        />
        <ReportCard
          title="Transport Fees"
          description="View transport payments by route."
          onClick={() => router.push('/admin/reports/transport-fees')}
        />
        <ReportCard
          title="Attendance"
          description="View and track daily student attendance."
          onClick={() => router.push('/admin/reports/attendance')}
        />
      </div>
    </div>
  )
}

function ReportCard({
  title,
  description,
  onClick,
}: {
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition cursor-pointer"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
