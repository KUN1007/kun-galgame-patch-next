'use client'

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface MonthNavigationProps {
  currentMonth: number
  availableMonths: string[]
  onMonthChange: (month: number) => void
  currentYear: number
  onYearChange: (year: number) => void
}

export const MonthNavigation = ({
  currentMonth,
  availableMonths,
  onMonthChange,
  currentYear,
  onYearChange
}: MonthNavigationProps) => {
  const currentIndex = currentMonth - 1
  const hasPrevious = currentIndex < 11
  const hasNext = currentIndex > 0

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  return (
    <motion.div
      className="flex items-center justify-between w-full mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        isIconOnly
        variant="light"
        aria-label="Previous month"
        isDisabled={!hasPrevious}
        onPress={() => hasPrevious && onMonthChange(currentIndex + 2)}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>

      <div className="flex gap-2">
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              className="capitalize"
              endContent={<Calendar className="w-4 h-4" />}
            >
              {currentYear}年
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Year selection"
            variant="flat"
            selectionMode="single"
            selectedKeys={[currentYear.toString()]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string
              if (selected) onYearChange(parseInt(selected))
            }}
          >
            {years.map((year) => (
              <DropdownItem key={year}>{`${year} 年`}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              className="capitalize"
              endContent={<Calendar className="w-4 h-4" />}
            >
              {`${currentMonth} 月`}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Month selection"
            variant="flat"
            selectionMode="single"
            selectedKeys={[currentMonth]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string
              if (selected) {
                onMonthChange(Number(selected))
              }
            }}
          >
            {availableMonths.map((month) => (
              <DropdownItem key={month}>{`${month} 月`}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>

      <Button
        isIconOnly
        variant="light"
        aria-label="Next month"
        isDisabled={!hasNext}
        onPress={() => hasNext && onMonthChange(currentIndex)}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </motion.div>
  )
}
