'use client'

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination
} from '@nextui-org/react'
import { api } from '~/lib/trpc-client'
import { useState, useEffect } from 'react'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { RenderCell } from './RenderCell'
import type { AdminResource } from '~/types/api/admin'

const columns = [
  { name: '游戏名', id: 'name' },
  { name: '用户', id: 'user' },
  { name: '存储', id: 'storage' },
  { name: '大小', id: 'size' },
  { name: '时间', id: 'created' },
  { name: '操作', id: 'actions' }
]

interface Props {
  initialResources: AdminResource[]
  total: number
}

export const Resource = ({ initialResources, total }: Props) => {
  const [resources, setResources] = useState<AdminResource[]>(initialResources)
  const [page, setPage] = useState(1)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchData = async () => {
    setLoading(true)
    const data = await api.admin.getPatchResource.query({
      page,
      limit: 100
    })
    setLoading(false)
    setResources(data.resources)
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
        <h1 className="text-2xl font-bold">补丁管理</h1>
        <Chip color="primary" variant="flat">
          正在开发中...
        </Chip>
      </div>

      {loading ? (
        <KunLoading hint="正在获取补丁资源数据..." />
      ) : (
        <Table
          aria-label="补丁管理"
          bottomContent={
            <div className="flex justify-center w-full">
              {total >= 100 && (
                <Pagination
                  showControls
                  color="primary"
                  page={page}
                  total={Math.ceil(total / 100)}
                  onChange={(page) => setPage(page)}
                />
              )}
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.id}>{column.name}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={resources}>
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
