import { ReactNode } from 'react'
import { KunSidebar } from '~/components/about/Sidebar'
import { KunTreeNode } from '~/lib/mdx/types'
import { getDirectoryTree } from '~/lib/mdx/directoryTree'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const tree = getDirectoryTree()

  return (
    <div className="container flex mx-auto my-8">
      <KunSidebar tree={tree} />
      <div className="flex w-full overflow-y-auto">{children}</div>
    </div>
  )
}
