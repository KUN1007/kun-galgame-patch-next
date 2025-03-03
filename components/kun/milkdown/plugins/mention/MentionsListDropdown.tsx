'use client'

import { useEffect, useState, useTransition } from 'react'
import { Avatar, Listbox, ListboxItem, Skeleton } from '@nextui-org/react'
import { kunFetchGet } from '~/utils/kunFetch'
import { useDebounce } from 'use-debounce'
import type { MentionsListDropdownProps } from './MentionsWidget'

export const MentionsListDropdown = ({
  queryText,
  onMentionItemClick
}: MentionsListDropdownProps) => {
  const [users, setUsers] = useState<KunUser[]>([])
  const [debouncedQueryText] = useDebounce(queryText, 300)
  const [isPending, startTransition] = useTransition()

  const fetchUsers = async () => {
    if (!debouncedQueryText || debouncedQueryText.length < 1) {
      setUsers([])
      return
    }
    startTransition(async () => {
      const response = await kunFetchGet<KunUser[]>('/user/mention/search', {
        query: debouncedQueryText
      })
      setUsers(response)
    })
  }

  useEffect(() => {
    fetchUsers()
  }, [debouncedQueryText])

  return (
    <div className="w-full px-1 py-2 shadow max-w-64 bg-background border-small rounded-small border-default-200 dark:border-default-100">
      {isPending ? (
        <div className="w-64 p-2 space-y-2">
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
          disabledKeys={['null']}
        >
          {users.length ? (
            (user) => (
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
            )
          ) : (
            <ListboxItem
              key="null"
              textValue="null"
              classNames={{
                base: 'w-64',
                wrapper: 'w-full'
              }}
            >
              未找到任何用户
            </ListboxItem>
          )}
        </Listbox>
      )}
    </div>
  )
}
