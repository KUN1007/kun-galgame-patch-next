'use client'

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown'
import { Button } from '@nextui-org/button'
import { Card, CardHeader } from '@nextui-org/card'
import { ArrowDownAZ, ArrowUpAZ, ChevronDown } from 'lucide-react'
import type { SortOption, SortDirection } from './_sort'

interface Props {
  sortField: SortOption
  setSortField: (option: SortOption) => void
  sortOrder: SortDirection
  setSortOrder: (direction: SortDirection) => void
}

const sortFieldLabelMap: Record<string, string> = {
  created: '创建时间',
  download: '下载数',
  like: '点赞数'
}

export const FilterBar = ({
  sortField,
  setSortField,
  sortOrder,
  setSortOrder
}: Props) => {
  return (
    <Card className="w-full border bg-content1/50 backdrop-blur-lg border-content2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                className="transition-colors bg-content2/50 hover:bg-content2"
                endContent={<ChevronDown className="w-4 h-4" />}
                radius="lg"
              >
                {sortFieldLabelMap[sortField]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="排序选项"
              onAction={(key) => setSortField(key as SortOption)}
              className="min-w-[120px]"
            >
              <DropdownItem key="created" className="text-default-700">
                创建时间
              </DropdownItem>
              <DropdownItem key="download" className="text-default-700">
                下载数
              </DropdownItem>
              <DropdownItem key="like" className="text-default-700">
                点赞数
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            variant="flat"
            className="transition-colors bg-content2/50 hover:bg-content2"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            startContent={
              sortOrder === 'asc' ? (
                <ArrowUpAZ className="w-4 h-4" />
              ) : (
                <ArrowDownAZ className="w-4 h-4" />
              )
            }
            radius="lg"
          >
            {sortOrder === 'asc' ? '升序' : '降序'}
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
