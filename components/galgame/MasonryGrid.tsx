'use client'

import { useEffect, useRef, useState } from 'react'
import { useWindowSize } from '~/hooks/useWindowSize'
import { useMounted } from '~/hooks/useMounted'

interface MasonryGridProps {
  children: React.ReactNode[]
  columnWidth?: number
  gap?: number
}

export const MasonryGrid = ({
  children,
  columnWidth = 256,
  gap = 24
}: MasonryGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)
  const isMounted = useMounted()
  const { width: windowWidth } = useWindowSize()

  useEffect(() => {
    const calculateColumns = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const newColumns = Math.max(
        1,
        Math.floor(containerWidth / (columnWidth + gap))
      )
      setColumns(newColumns)
    }

    calculateColumns()
  }, [columnWidth, gap, windowWidth])

  const distributeItems = () => {
    const columnHeights = Array(columns).fill(0)
    const columnItems: React.ReactNode[][] = Array(columns)
      .fill(null)
      .map(() => [])

    children.forEach((child, index) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
      columnItems[shortestColumn].push(child)
      columnHeights[shortestColumn]++
    })

    return columnItems
  }

  return (
    <div
      ref={containerRef}
      className={`w-full transition-opacity duration-300 ${isMounted ? 'opacity-100' : 'opacity-0'}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {distributeItems().map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-6">
          {column}
        </div>
      ))}
    </div>
  )
}
