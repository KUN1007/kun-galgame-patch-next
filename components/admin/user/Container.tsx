'use client'

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Chip
} from '@nextui-org/react'
import { useState, useEffect } from 'react'
import { RenderCell } from './RenderCell'
import { api } from '~/lib/trpc-client'
import { KunLoading } from '~/components/kun/Loading'
import { useMounted } from '~/hooks/useMounted'
import type { AdminUser } from '~/types/api/admin'

const columns = [
  { name: '用户', uid: 'user' },
  { name: '角色', uid: 'role' },
  { name: '状态', uid: 'status' },
  { name: '操作', uid: 'actions' }
]

interface Props {
  initialUsers: AdminUser[]
  total: number
}

export const User = ({ initialUsers, total }: Props) => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [page, setPage] = useState(1)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchData = async () => {
    setLoading(true)
    const data = await api.admin.getUserInfo.query({
      page,
      limit: 100
    })
    setLoading(false)
    setUsers(data.users)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchData()
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Chip color="primary" variant="flat">
          八嘎! 不许视奸!
        </Chip>
      </div>

      {loading ? (
        <KunLoading hint="正在获取消息数据..." />
      ) : (
        <Table
          aria-label="Users table"
          bottomContent={
            <div className="flex justify-center w-full">
              {total >= 100 && (
                <Pagination
                  showControls
                  color="primary"
                  page={page}
                  total={total}
                  onChange={(page) => setPage(page)}
                />
              )}
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
