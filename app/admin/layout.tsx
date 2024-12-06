'use client'

import { Sidebar } from '~/components/admin/Sidebar'
// import { Navbar } from '~/components/admin/Navbar'

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto my-8 flex">
      <Sidebar />
      <div className="flex w-full overflow-y-auto">
        {/* <Navbar /> */}
        <div className="w-full p-4">{children}</div>
      </div>
    </div>
  )
}
