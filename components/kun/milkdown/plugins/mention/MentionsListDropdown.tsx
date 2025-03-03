'use client'

import { useEffect, useState } from 'react'
import { Avatar, Listbox, ListboxItem, Skeleton } from '@nextui-org/react'
import { kunFetchGet } from '~/utils/kunFetch'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { MentionsListDropdownProps } from './MentionsWidget'

export const MentionsListDropdown = ({
  queryText,
  onMentionItemClick
}: MentionsListDropdownProps) => {
  const [users, setUsers] = useState<KunUser[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    if (!queryText || queryText.length < 1) {
      setUsers([])
      return
    }
    setLoading(true)
    const response = await kunFetchGet<KunUser[]>('/user/search', {
      query: queryText
    })
    setUsers(response)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [queryText])

  if (users.length === 0 && queryText) {
    return (
      <div className="w-full max-w-[260px] border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100">
        <p className="p-2 text-sm text-muted-foreground">No users found</p>
      </div>
    )
  }

  if (users.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-[260px] shadow bg-background border-small px-1 py-2 rounded-small border-default-200 dark:border-default-100">
      {loading ? (
        <div className="p-2 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-32 h-4" />
            </div>
          ))}
        </div>
      ) : (
        <Listbox
          aria-label="User mentions"
          classNames={{
            base: 'max-w-xs',
            list: 'max-h-[300px] overflow-scroll scrollbar-hide !p-0 !m-0'
          }}
          items={users}
          selectionMode="single"
          variant="flat"
          onSelectionChange={(keys) => {
            const userId = Array.from(keys)[0]
            const selectedUser = users.find(
              (user) => user.id === Number(userId)
            )
            if (userId && selectedUser) {
              onMentionItemClick(selectedUser.name, `/user/${userId}/resource`)
            }
          }}
        >
          {(user) => (
            <ListboxItem key={user.id} textValue={user.name}>
              <div className="flex items-center gap-2">
                <Avatar
                  alt={user.name}
                  className="flex-shrink-0 w-8 h-8"
                  src={user.avatar}
                />
                <span className="text-sm">{user.name}</span>
              </div>
            </ListboxItem>
          )}
        </Listbox>
      )}
    </div>
  )
}
