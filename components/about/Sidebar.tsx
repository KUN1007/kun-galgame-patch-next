'use client'

import { KunTreeNode } from '~/lib/mdx/types'
import { TreeItem } from './SideTreeItem'

interface Props {
  tree: KunTreeNode
}

export const KunSidebar = ({ tree }: Props) => {
  return (
    <div className="w-64 h-screen p-4 overflow-y-auto border-r border-default-200">
      <h2 className="mb-4 text-lg font-semibold">目录</h2>
      <TreeItem node={tree} level={0} />
    </div>
  )
}
