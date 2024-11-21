'use client'

import { Button } from '@nextui-org/react'
import { Bell, Heart, MessageCircle, UserPlus, Globe } from 'lucide-react'

interface NotificationSidebarProps {
  activeType: string | null
  onTypeChange: (type: string | null) => void
}

export const MessageNav = ({
  activeType,
  onTypeChange
}: NotificationSidebarProps) => {
  const notificationTypes = [
    { type: null, label: 'All Notifications', icon: Bell },
    { type: 'LIKE', label: 'Likes', icon: Heart },
    { type: 'COMMENT', label: 'Comments', icon: MessageCircle },
    { type: 'FOLLOW', label: 'Follows', icon: UserPlus },
    { type: 'SYSTEM', label: 'System', icon: Globe }
  ]

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Filter Notifications</h2>
      <div className="flex flex-row gap-2 lg:flex-col">
        {notificationTypes.map(({ type, label, icon: Icon }) => (
          <Button
            key={label}
            color={activeType === type ? 'primary' : 'default'}
            onClick={() => onTypeChange(type)}
            className="justify-start w-full"
            variant={activeType === type ? 'solid' : 'light'}
            startContent={<Icon className="w-4 h-4" />}
          >
            <span className="hidden lg:inline">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
