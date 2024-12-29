'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { KunTreeNode } from '~/lib/mdx/types'
import { TreeItem } from './SideTreeItem'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/utils/cn'
import './nav.scss'

interface Props {
  tree: KunTreeNode
}

export const KunSidebar = ({ tree }: Props) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="kun-scroll-nav">
      <aside
        className={cn(
          'fixed top-32 z-50 h-[calc(100dvh-256px)] w-64 transform bg-background transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full px-4 py-6 overflow-scroll border-r bg-background">
          <h2 className="px-2 mb-4 text-lg font-semibold">目录</h2>
          <TreeItem node={tree} level={0} />
        </div>
      </aside>

      <Button
        isIconOnly
        variant="flat"
        className="fixed left-0 z-50 -translate-y-1/2 top-1/2 md:hidden"
        onPress={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}
