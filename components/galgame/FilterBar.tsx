'use client'

import {
  Select,
  SelectItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react'
import { ChevronDown } from 'lucide-react'

type SortOption = 'created' | 'view'
type SortDirection = 'asc' | 'desc'

interface Props {
  selectedTypes: string[]
  setSelectedTypes: (types: string[]) => void
  sortBy: SortOption
  setSortBy: (option: SortOption) => void
  sortDirection: SortDirection
  setSortDirection: (direction: SortDirection) => void
}

const SUPPORTED_TYPES = [
  '人工翻译补丁',
  'AI 翻译补丁',
  '机翻润色',
  '机翻补丁',
  '全 CG 存档',
  '破解补丁',
  '修正补丁',
  '魔改补丁',
  '其它'
]

export function FilterBar({
  selectedTypes,
  setSelectedTypes,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection
}: Props) {
  return (
    <div className="flex flex-col gap-4 mb-6 sm:flex-row">
      <Select
        label="类型筛选"
        selectionMode="multiple"
        placeholder="选择类型"
        selectedKeys={selectedTypes}
        className="max-w-xs"
        onSelectionChange={(keys) =>
          setSelectedTypes(Array.from(keys) as string[])
        }
      >
        {SUPPORTED_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </Select>

      <div className="flex gap-2">
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              endContent={<ChevronDown className="w-4 h-4" />}
            >
              {sortBy === 'created' ? '创建时间' : '浏览量'}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="排序选项"
            onAction={(key) => setSortBy(key as SortOption)}
          >
            <DropdownItem key="created">创建时间</DropdownItem>
            <DropdownItem key="view">浏览量</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Button
          variant="flat"
          onClick={() =>
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
          }
        >
          {sortDirection === 'asc' ? '升序' : '降序'}
        </Button>
      </div>
    </div>
  )
}
