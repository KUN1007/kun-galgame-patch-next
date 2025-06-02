'use client'

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from "@heroui/dropdown"
import { Button } from "@heroui/button"
import { Card, CardHeader } from "@heroui/card"
import { Select, SelectItem } from "@heroui/select"
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  Filter,
  Calendar
} from 'lucide-react'
import { ALL_SUPPORTED_TYPE, SUPPORTED_TYPE_MAP } from '~/constants/resource'
import {
  GALGAME_SORT_FIELD_LABEL_MAP,
  GALGAME_SORT_YEARS,
  GALGAME_SORT_YEARS_MAP,
  GALGAME_SORT_MONTHS
} from '~/constants/galgame'
import type { SortDirection, SortOption } from './_sort'

interface Props {
  selectedType: string
  setSelectedType: (types: string) => void
  sortField: SortOption
  setSortField: (option: SortOption) => void
  sortOrder: SortDirection
  setSortOrder: (direction: SortDirection) => void
  selectedYears: string[]
  setSelectedYears: (years: string[]) => void
  selectedMonths: string[]
  setSelectedMonths: (months: string[]) => void
}

export const FilterBar = ({
  selectedType,
  setSelectedType,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  selectedYears,
  setSelectedYears,
  selectedMonths,
  setSelectedMonths
}: Props) => {
  return (
    <Card className="w-full border border-content2 bg-content1/50 backdrop-blur-lg">
      <CardHeader>
        <div className="flex flex-col w-full gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select
            disallowEmptySelection
            label="类型筛选"
            placeholder="选择类型"
            selectedKeys={[selectedType]}
            onChange={(event) => setSelectedType(event.target.value)}
            startContent={<Filter className="size-4 text-default-400" />}
            radius="lg"
            size="sm"
          >
            {ALL_SUPPORTED_TYPE.map((type) => (
              <SelectItem key={type} value={type} className="text-default-700">
                {SUPPORTED_TYPE_MAP[type]}
              </SelectItem>
            ))}
          </Select>

          <Select
            disallowEmptySelection
            label="发售年份"
            placeholder="选择年份"
            selectedKeys={selectedYears}
            onSelectionChange={(keys) => {
              if (keys.anchorKey === 'all') {
                setSelectedYears(['all'])
                setSelectedMonths(['all'])
              } else {
                setSelectedYears(
                  Array.from(keys as Set<string>).filter(
                    (item) => item !== 'all'
                  )
                )
              }
            }}
            startContent={<Calendar className="size-4 text-default-400" />}
            selectionMode="multiple"
            radius="lg"
            size="sm"
          >
            {GALGAME_SORT_YEARS.map((year) => (
              <SelectItem key={year} value={year} className="text-default-700">
                {GALGAME_SORT_YEARS_MAP[year] ?? year}
              </SelectItem>
            ))}
          </Select>

          <Select
            disallowEmptySelection
            label="发售月份"
            placeholder="选择月份"
            selectedKeys={selectedMonths}
            onSelectionChange={(keys) => {
              if (keys.anchorKey === 'all') {
                setSelectedMonths(['all'])
              } else {
                setSelectedMonths(
                  Array.from(keys as Set<string>).filter(
                    (item) => item !== 'all'
                  )
                )
              }
            }}
            startContent={<Calendar className="size-4 text-default-400" />}
            selectionMode="multiple"
            radius="lg"
            size="sm"
            isDisabled={
              selectedYears.includes('all') || selectedYears.includes('future')
            }
          >
            {GALGAME_SORT_MONTHS.map((month) => (
              <SelectItem
                key={month}
                value={month}
                className="text-default-700"
              >
                {month === 'all' ? '全部月份' : month}
              </SelectItem>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  style={{
                    fontSize: '0.875rem'
                  }}
                  endContent={<ChevronDown className="size-4" />}
                  radius="lg"
                  size="lg"
                >
                  {GALGAME_SORT_FIELD_LABEL_MAP[sortField]}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="排序选项"
                selectedKeys={new Set([sortField])}
                onAction={(key) => setSortField(key as SortOption)}
                selectionMode="single"
              >
                {Object.entries(GALGAME_SORT_FIELD_LABEL_MAP).map(
                  ([key, label]) => (
                    <DropdownItem key={key} className="text-default-700">
                      {label}
                    </DropdownItem>
                  )
                )}
              </DropdownMenu>
            </Dropdown>

            <Button
              variant="flat"
              style={{
                fontSize: '0.875rem'
              }}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              startContent={
                sortOrder === 'asc' ? (
                  <ArrowUpAZ className="size-4" />
                ) : (
                  <ArrowDownAZ className="size-4" />
                )
              }
              radius="lg"
              size="lg"
            >
              {sortOrder === 'asc' ? '升序' : '降序'}
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
