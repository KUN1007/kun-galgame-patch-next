'use client'

import { Tooltip } from "@heroui/tooltip"
import { Badge } from "@heroui/badge"
import { formatNumber } from '~/utils/formatNumber'

export const UserStatsItem = ({
  icon,
  value,
  increment,
  label
}: {
  icon: React.ReactNode
  value: number
  increment: number
  label: string
}) => {
  const incrementLabel = `${increment > 0 ? '+' : ''}${formatNumber(increment)}`
  return (
    <Badge
      content={incrementLabel}
      color="success"
      variant="flat"
      size="md"
      className="ml-2"
    >
      <Tooltip content={`${value} ${label}${` (${incrementLabel})`}`}>
        <div className="flex items-center w-full gap-2 px-3 py-2 bg-default-100 rounded-2xl">
          {icon}
          <span>{value}</span>
        </div>
      </Tooltip>
    </Badge>
  )
}
