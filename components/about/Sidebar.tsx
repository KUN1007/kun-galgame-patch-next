'use client'

import { TreeNode } from '~/lib/mdx/types'
import { Accordion, AccordionItem } from '@nextui-org/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  tree: TreeNode
}

export const KunSidebar = ({ tree }: SidebarProps) => {
  const pathname = usePathname()

  const renderNode = (node: TreeNode) => {
    if (node.type === 'file') {
      return (
        <Link
          href={`/about/${node.path}`}
          className={`block px-4 py-2 text-sm hover:bg-default-100 dark:hover:bg-default-800 ${
            pathname === `/posts/${node.path}`
              ? 'bg-default-100 dark:bg-default-800'
              : ''
          }`}
        >
          {node.name}
        </Link>
      )
    }

    if (
      node.type === 'directory' &&
      Array.isArray(node.children) &&
      node.children.length > 0
    ) {
      return (
        <Accordion>
          <AccordionItem
            key={node.path}
            aria-label={node.name}
            title={node.name}
            className="px-2"
          >
            {node.children.map((child, index) => (
              <div key={index}>{renderNode(child)}</div>
            ))}
          </AccordionItem>
        </Accordion>
      )
    }
    return null
  }

  return (
    <div className="w-64 h-screen overflow-y-auto border-r border-default-200 dark:border-default-800">
      <div className="p-4">
        <h2 className="mb-4 text-lg font-semibold">目录</h2>
        {renderNode(tree)}
      </div>
    </div>
  )
}
