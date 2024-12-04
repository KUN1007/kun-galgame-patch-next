import { ReactNode } from 'react'
import { KunSidebar } from '~/components/about/Sidebar'
import { getDirectoryTree } from '~/lib/mdx/directoryTree'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const tree = getDirectoryTree()

  return (
    <div className="container flex mx-auto my-8">
      <div className="fixed">
        <KunSidebar tree={tree} />
      </div>

      <div className="flex w-full overflow-y-auto md:ml-64">{children}</div>
    </div>
  )
}