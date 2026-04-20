'use client'

import {
  Chip,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Input
} from '@heroui/react'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RenderCell } from './RenderCell'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunLoading } from '~/components/kun/Loading'
import { useMounted } from '~/hooks/useMounted'
import { useDebounce } from 'use-debounce'
import type { AdminUser } from '~/types/api/admin'

const columns = [
  { name: '用户', uid: 'user' },
  { name: '角色', uid: 'role' },
  { name: '状态', uid: 'status' },
  { name: '操作', uid: 'actions' }
]

interface Props {
  initialUsers: AdminUser[]
  initialTotal: number
}

export const User = ({ initialUsers, initialTotal }: Props) => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchData = async () => {
    setLoading(true)

    const { users, total } = await kunFetchGet<{
      users: AdminUser[]
      total: number
    }>('/admin/user', {
      page,
      limit: 30,
      search: debouncedQuery
    })

    setLoading(false)
    setUsers(users)
    setTotal(total)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchData()
  }, [page, debouncedQuery])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Chip color="primary" variant="flat">
          杂鱼! 不许视奸!
        </Chip>
      </div>

      <Input
        fullWidth
        isClearable
        placeholder="使用用户名搜索用户"
        startContent={<Search className="text-default-300" size={20} />}
        value={searchQuery}
        onValueChange={handleSearch}
      />

      {loading ? (
        <KunLoading hint="正在获取用户数据..." />
      ) : (
        <Table
          aria-label="用户管理"
          bottomContent={
            <div className="flex justify-center w-full">
              <Pagination
                showControls
                color="primary"
                page={page}
                total={Math.ceil(total / 30)}
                onChange={(page) => setPage(page)}
              />
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={users}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>
                    {RenderCell(item, columnKey.toString())}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
