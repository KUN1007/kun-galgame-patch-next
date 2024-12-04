'use client'

import { useState } from 'react'
import { Chip } from '@nextui-org/chip'
import { KunTreeNode } from '~/lib/mdx/types'
import { TreeItem } from './SideTreeItem'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/utils/cn'

interface Props {
  tree: KunTreeNode
}

export const KunSidebar = ({ tree }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside
      className={cn(
        'fixed z-50 md:static w-64 h-full bg-background border-r border-divider transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'flex items-center'
      )}
    >
      <div className="flex flex-col w-full h-full">
        <h2 className="mb-4 text-lg font-semibold">目录</h2>
        <TreeItem node={tree} level={0} />
      </div>

      <Chip
        className="translate-x-3 md:hidden text-default-500"
        variant="light"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </Chip>
    </aside>
  )
}
