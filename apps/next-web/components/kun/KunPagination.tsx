'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@heroui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  total: number
  onChange: (page: number) => void
  isDisabled?: boolean
}

export const KunPagination = ({
  page,
  total,
  onChange,
  isDisabled = false
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handlePrevPage = () => {
    if (page > 1) {
      onChange(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < total) {
      onChange(page + 1)
    }
  }

  const handlePageSelect = () => {
    const pageNum = parseInt(inputValue, 10)
    if (pageNum >= 1 && pageNum <= total) {
      onChange(pageNum)
      setIsOpen(false)
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageSelect()
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setInputValue(String(page))
    }
  }

  if (total <= 1) {
    return null
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          isIconOnly
          variant="flat"
          onPress={handlePrevPage}
          isDisabled={isDisabled || page <= 1}
          aria-label="上一页"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <Popover
          isOpen={isOpen}
          onOpenChange={handleOpenChange}
          placement="top"
          offset={8}
        >
          <PopoverTrigger>
            <Button
              variant="flat"
              isDisabled={isDisabled}
              className="min-w-20 font-mono"
            >
              {page} / {total}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-3">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-default-500">跳转到页码</span>
              <div className="flex gap-2">
                <Input
                  type="number"
                  size="sm"
                  min={1}
                  max={total}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`1 - ${total}`}
                  className="w-24"
                  autoFocus
                />
                <Button size="sm" color="primary" onPress={handlePageSelect}>
                  跳转
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          isIconOnly
          variant="flat"
          onPress={handleNextPage}
          isDisabled={isDisabled || page >= total}
          aria-label="下一页"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <span className="text-xs text-default-400">点击页码可跳转指定页</span>
    </div>
  )
}
