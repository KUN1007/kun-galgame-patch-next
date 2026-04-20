import { Sidebar } from '~/components/admin/Sidebar'
// import { Navbar } from '~/components/admin/Navbar'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

interface Props {
  children: React.ReactNode
}

export default function AdminLayout({ children }: Props) {
  return (
    <div className="container flex mx-auto my-4">
      <Sidebar />
      <div className="flex w-full overflow-y-auto">
        {/* <Navbar /> */}
        <div className="w-full p-4">{children}</div>
      </div>
    </div>
  )
}
