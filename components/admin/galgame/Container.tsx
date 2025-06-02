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
} from "@heroui/react"
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RenderCell } from './RenderCell'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunLoading } from '~/components/kun/Loading'
import { useMounted } from '~/hooks/useMounted'
import { useDebounce } from 'use-debounce'
import type { AdminGalgame } from '~/types/api/admin'

const columns = [
  { name: '封面', uid: 'banner' },
  { name: '标题', uid: 'name' },
  { name: '用户', uid: 'user' },
  { name: '时间', uid: 'created' }
]

interface Props {
  initialGalgames: AdminGalgame[]
  initialTotal: number
}

export const Galgame = ({ initialGalgames, initialTotal }: Props) => {
  const [galgames, setGalgames] = useState<AdminGalgame[]>(initialGalgames)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchData = async () => {
    setLoading(true)

    const { galgames, total } = await kunFetchGet<{
      galgames: AdminGalgame[]
      total: number
    }>('/admin/galgame', {
      page,
      limit: 30,
      search: debouncedQuery
    })

    setLoading(false)
    setGalgames(galgames)
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
        <h1 className="text-2xl font-bold">Galgame 管理</h1>
        <Chip color="primary" variant="flat">
          正在开发中...
        </Chip>
      </div>

      <Input
        fullWidth
        isClearable
        placeholder="输入 Galgame 名搜索 Galgame"
        startContent={<Search className="text-default-300" size={20} />}
        value={searchQuery}
        onValueChange={handleSearch}
      />

      {loading ? (
        <KunLoading hint="正在获取 Galgame 数据..." />
      ) : (
        <Table
          aria-label="Galgame 管理"
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
