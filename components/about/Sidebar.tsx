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

export const KunSidebar = ({ tree }: Props) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <div className="kun-scroll-nav">
      <div
        className="fixed top-0 left-0 flex items-center h-full text-default-500 md:hidden"
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
          <DrawerHeader className="flex flex-col gap-1">文档目录</DrawerHeader>
          <DrawerBody>
            <div className="flex flex-col h-full px-4 py-6 overflow-scroll border-r bg-background">
              <h2 className="px-2 mb-4 text-lg font-semibold">目录</h2>

              <div>
                {tree.type === 'directory' &&
                  tree.children?.map((child, index) => (
                    <TreeItem key={index} node={child} level={0} />
                  ))}
              </div>
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
