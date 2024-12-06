'use client'

import { useState } from 'react'
import { KunTreeNode } from '~/lib/mdx/types'
import { ChevronRight, FileText, FolderOpen } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

interface TreeItemProps {
  node: KunTreeNode
  level: number
}

export const TreeItem = ({ node, level }: TreeItemProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen)
    } else {
      router.push(`/about/${node.path}`)
    }
  }

  return (
    <nav className="select-none">
      <div
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-default-100 ${
          level === 0 ? 'mt-0' : 'mt-1'
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            <ChevronRight
              size={16}
              className={`transition-transform${isOpen ? 'rotate-90' : ''}`}
            />
            <FolderOpen size={16} className="text-warning" />
          </>
        ) : (
          <FileText size={16} className="ml-5 text-primary" />
        )}
        <span className="text-sm">{node.name}</span>
      </div>
      {node.type === 'directory' &&
        isOpen &&
        node.children?.map((child, index) => (
          <TreeItem key={index} node={child} level={level + 1} />
        ))}
    </nav>
  )
}
