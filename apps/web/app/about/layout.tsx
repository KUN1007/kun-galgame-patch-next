import { ReactNode } from 'react'
import { KunSidebar } from '~/components/about/Sidebar'
import { getDirectoryTree } from '~/lib/mdx/directoryTree'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const tree = getDirectoryTree()

  return (
    <div className="container flex mx-auto my-4">
      <KunSidebar tree={tree} />
      <main className="flex-1 pl-0 overflow-y-auto md:pl-64">{children}</main>
    </div>
  )
}
