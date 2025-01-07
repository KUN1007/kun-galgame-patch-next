'use client'

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  useDisclosure
} from '@nextui-org/react'
import { KunTreeNode } from '~/lib/mdx/types'
import { TreeItem } from './SideTreeItem'
import { ChevronRight } from 'lucide-react'
import './nav.scss'

interface Props {
  tree: KunTreeNode
}

const SidebarContent = ({ tree }: Props) => {
  return (
    <div>
      {tree.type === 'directory' &&
        tree.children?.map((child, index) => (
          <TreeItem key={index} node={child} level={0} />
        ))}
    </div>
  )
}

export const KunSidebar = ({ tree }: Props) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <div className="kun-scroll-nav">
      <aside className="fixed hidden md:block top-32 h-[calc(100dvh-256px)] w-64 bg-background">
        <div className="flex flex-col h-full px-4 overflow-scroll border-r bg-background">
          <h2 className="px-2 mb-4 text-lg font-semibold">目录</h2>
          {SidebarContent({ tree })}
        </div>
      </aside>

      <div
        className="fixed top-0 left-0 flex items-center h-full cursor-pointer text-default-500 md:hidden"
        onClick={() => onOpen()}
      >
        <ChevronRight size={24} />
      </div>

      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="left"
        size="xs"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">目录</DrawerHeader>
          <DrawerBody>{SidebarContent({ tree })}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
