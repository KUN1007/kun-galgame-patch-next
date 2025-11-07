'use client'

import { Tab, Tabs } from '@heroui/tabs'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/dropdown'
import { Button } from '@heroui/button'
import { Puzzle, User, ChevronDown } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@bprogress/next'
import { KunHeader } from '~/components/kun/Header'
import {
  userSortOptions,
  patchSortOptions,
  timeRangeOptions
} from '~/constants/ranking'

type ContainerProps = {
  type: 'user' | 'patch'
  sortBy: string
  timeRange: string
  children: React.ReactNode
}

// TODO:
export const RankingContainer = ({
  type,
  sortBy,
  timeRange,
  children
}: ContainerProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    router.push(`/ranking/${value}?${params.toString()}`)
  }

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', value)
    router.push(`/ranking/${type}?${params.toString()}`)
  }

  const handleTimeRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('timeRange', value)
    router.push(`/ranking/${type}?${params.toString()}`)
  }

  const sortOptions = type === 'user' ? userSortOptions : patchSortOptions
  const currentSortOption =
    sortOptions.find((option) => option.key === sortBy) || sortOptions[0]
  const currentTimeRange =
    timeRangeOptions.find((option) => option.key === timeRange) ||
    timeRangeOptions[6]

  return (
    <div className="container my-6 space-y-6">
      <KunHeader
        name="排行榜单"
        description={
          timeRange !== 'all'
            ? `查看${currentTimeRange.label}的数据增长情况`
            : '查看全部时间的数据累计'
        }
        endContent={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              aria-label="排行榜类型"
              selectedKey={type}
              onSelectionChange={(key) => handleTabChange(key as string)}
              color="primary"
            >
              <Tab
                key="user"
                title={
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>用户排名</span>
                  </div>
                }
              />
              <Tab
                key="patch"
                title={
                  <div className="flex items-center gap-2">
                    <Puzzle className="size-4" />
                    <span>补丁排名</span>
                  </div>
                }
              />
            </Tabs>

            <div className="flex flex-wrap gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    endContent={<ChevronDown className="size-4" />}
                  >
                    {currentSortOption.label}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="排序选项"
                  onAction={(key) => handleSortChange(key as string)}
                  selectedKeys={[sortBy]}
                  selectionMode="single"
                  variant="flat"
                  items={sortOptions}
                >
                  {(option) => (
                    <DropdownItem
                      key={option.key}
                      startContent={option.icon}
                      description={option.description}
                      textValue={option.label}
                    >
                      {option.label}
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>

              {/* <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    startContent={<Calendar className="size-4" />}
                    endContent={<ChevronDown className="size-4" />}
                  >
                    {currentTimeRange.label}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="时间范围选项"
                  onAction={(key) => handleTimeRangeChange(key as string)}
                  selectedKeys={[timeRange]}
                  selectionMode="single"
                  variant="flat"
                >
                  {timeRangeOptions.map((option) => (
                    <DropdownItem
                      key={option.key}
                      textValue={option.label}
                      description={option.description}
                    >
                      {option.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown> */}
            </div>
          </div>
        }
      />

      {children}
    </div>
  )
}
