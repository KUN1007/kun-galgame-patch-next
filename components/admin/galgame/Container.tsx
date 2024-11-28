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
import type { AdminGalgame } from '~/types/api/admin'

const columns = [
  { name: '封面', uid: 'banner' },
  { name: '标题', uid: 'name' },
  { name: '用户', uid: 'user' },
  { name: '时间', uid: 'created' }
]

interface Props {
  initialGalgames: AdminGalgame[]
  total: number
}

export const Galgame = ({ initialGalgames, total }: Props) => {
  const [galgames, setGalgames] = useState<AdminGalgame[]>(initialGalgames)
  const [page, setPage] = useState(1)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchUserData = async () => {
    setLoading(true)
    const data = await api.admin.getGalgame.query({
      page,
      limit: 100
    })
    setLoading(false)
    setGalgames(data.galgames)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchUserData()
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Galgame 管理</h1>
        <Chip color="primary" variant="flat">
          正在开发中...
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
                  isCompact
                  showControls
                  showShadow
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
          <TableBody items={galgames}>
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
