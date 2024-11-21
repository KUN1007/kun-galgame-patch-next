'use client'

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown'
import { Button } from '@nextui-org/button'
import { Card, CardHeader } from '@nextui-org/card'
import { Select, SelectItem } from '@nextui-org/select'
import { ArrowDownAZ, ArrowUpAZ, ChevronDown, Filter } from 'lucide-react'
import { ALL_SUPPORTED_TYPES } from '~/constants/resource'
import type { SortOption, SortDirection } from './_sort'

interface Props {
  selectedTypes: string[]
  setSelectedTypes: (types: string[]) => void
  sortField: SortOption
  setSortField: (option: SortOption) => void
  sortOrder: SortDirection
  setSortOrder: (direction: SortDirection) => void
}

export const FilterBar = ({
  selectedTypes,
  setSelectedTypes,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder
}: Props) => {
  const sortFieldLabel = {
    created: '创建时间',
    view: '浏览量'
  }

  const handleSelectionChange = (keys: Set<React.Key>) => {
    setSelectedTypes(Array.from(keys) as string[])
  }

  return (
    <Card className="w-full border bg-content1/50 backdrop-blur-lg border-content2">
      <CardHeader>
        <div className="flex flex-col w-full gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select
            label="类型筛选"
            // selectionMode="multiple"
            placeholder="选择类型"
            selectedKeys={selectedTypes}
            className="max-w-xs"
            onSelectionChange={(keys) => handleSelectionChange(new Set(keys))}
            startContent={<Filter className="w-4 h-4 text-default-400" />}
            classNames={{
              trigger: 'bg-content2/50 hover:bg-content2 transition-colors',
              value: 'text-default-700',
              label: 'text-default-600'
            }}
            radius="lg"
            size="sm"
          >
            {ALL_SUPPORTED_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="text-default-700">
                {type}
              </SelectItem>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  className="transition-colors bg-content2/50 hover:bg-content2"
                  endContent={<ChevronDown className="w-4 h-4" />}
                  radius="lg"
                >
                  {sortFieldLabel[sortField]}
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
                <DropdownItem key="view" className="text-default-700">
                  浏览量
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
        </div>
      </CardHeader>
    </Card>
  )
}
