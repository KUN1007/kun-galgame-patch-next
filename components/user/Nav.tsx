'use client'

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  User
} from '@nextui-org/react'
import { Settings, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserNavProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <User
          as="button"
          avatarProps={{
            isBordered: true,
            src: user.avatar
          }}
          className="transition-transform"
          description={user.email}
          name={user.name}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="User menu actions" variant="flat">
        <DropdownItem
          key="settings"
          startContent={<Settings className="w-4 h-4" />}
          onPress={() => router.push('user/1/settings')}
        >
          Settings
        </DropdownItem>
        <DropdownItem
          key="logout"
          className="text-danger"
          color="danger"
          startContent={<LogOut className="w-4 h-4" />}
        >
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
