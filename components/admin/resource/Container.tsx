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
import { kunFetchGet } from '~/utils/kunFetch'
import { useEffect, useState } from 'react'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { RenderCell } from './RenderCell'
import { useDebounce } from 'use-debounce'
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
  initialTotal: number
}

export const Resource = ({ initialResources, initialTotal }: Props) => {
  const [resources, setResources] = useState<AdminResource[]>(initialResources)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchData = async () => {
    setLoading(true)

    const { resources, total } = await kunFetchGet<{
      resources: AdminResource[]
      total: number
    }>('/admin/resource', {
      page,
      limit: 30,
      search: debouncedQuery
    })

    setLoading(false)
    setResources(resources)
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
        <h1 className="text-2xl font-bold">补丁管理</h1>
        <Chip color="primary" variant="flat">
          正在开发中...
        </Chip>
      </div>

      <Input
        fullWidth
        isClearable
        placeholder="输入补丁资源链接 (或 BLAKE3 Hash 值), 搜索补丁资源"
        startContent={<Search className="text-default-300" size={20} />}
        value={searchQuery}
        onValueChange={handleSearch}
      />

      {loading ? (
        <KunLoading hint="正在获取补丁资源数据..." />
      ) : (
        <Table
          aria-label="补丁管理"
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
