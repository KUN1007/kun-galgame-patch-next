'use client'

import { Download, Eye, FileText, Users } from 'lucide-react'

export function Statistics() {
  const stats = [
    { icon: Users, label: 'Active Users', value: '10,234' },
    { icon: FileText, label: 'Total Patches', value: '1,567' },
    { icon: Download, label: 'Downloads', value: '89,432' },
    { icon: Eye, label: 'Monthly Views', value: '234,567' }
  ]

  return (
    <section className="p-8 rounded-xl bg-content1">
      <h2 className="mb-6 text-3xl font-bold">Community Statistics</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="text-center">
            <Icon className="mx-auto mb-2" size={32} />
            <h3 className="mb-1 text-2xl font-bold">{value}</h3>
            <p className="text-default-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
