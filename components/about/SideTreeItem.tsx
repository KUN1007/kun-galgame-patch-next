'use client'

import { useState } from 'react'
import { Link } from '@nextui-org/link'
import { KunTreeNode } from '~/lib/mdx/types'
import { ChevronRight, FileText, FolderOpen } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import { cn } from '~/utils/cn'

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
      <Link
        className={cn(
          'w-full justify-start gap-2 px-3 py-2 hover:text-primary-500 cursor-pointer',
          level === 0 ? 'mt-0' : 'mt-1'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onPress={handleClick}
        color="foreground"
      >
        <div className="flex items-center gap-2">
          {node.type === 'directory' ? (
            <>
              <ChevronRight
                size={16}
                className={`transition-transform duration-200 ${
                  isOpen ? 'rotate-90' : ''
                }`}
              />
              <FolderOpen size={16} className="text-warning" />
            </>
          ) : (
            <FileText size={16} className="ml-5 text-primary shrink-0" />
          )}
          <span className="text-sm text-left text-wrap">{node.label}</span>
        </div>
      </Link>

      {node.type === 'directory' && isOpen && (
        <div className="overflow-hidden">
          {node.children?.map((child, index) => (
            <TreeItem key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </nav>
  )
}
