'use client'

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Pagination
} from '@nextui-org/react'
import { Edit2, Eye, Trash2 } from 'lucide-react'
import { useState } from 'react'

const patches = [
  {
    id: 1,
    name: '啊这可海星',
    vndb_id: 'v1007',
    status: 'active',
    language: ['English', 'Japanese'],
    released: '2019-10-07'
  },
  {
    id: 2,
    name: '莲最可爱了',
    vndb_id: 'v1007',
    status: 'pending',
    language: ['Chinese', 'English'],
    released: '2019-10-07'
  }
]

const columns = [
  { name: '游戏名', uid: 'name' },
  { name: 'VNDB ID', uid: 'vndb_id' },
  { name: '状态', uid: 'status' },
  { name: '语言', uid: 'language' },
  { name: '操作', uid: 'actions' }
]

export default function PatchesPage() {
  const [page, setPage] = useState(1)

  const renderCell = (patch: any, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <div className="font-medium">{patch.name}</div>
      case 'status':
        return (
          <Chip
            color={patch.status === 'active' ? 'success' : 'warning'}
            variant="flat"
          >
            {patch.status}
          </Chip>
        )
      case 'language':
        return (
          <div className="flex gap-1">
            {patch.language.map((lang: string) => (
              <Chip key={lang} size="sm" variant="flat">
                {lang}
              </Chip>
            ))}
          </div>
        )
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button isIconOnly size="sm" variant="light">
              <Eye size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light">
              <Edit2 size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" color="danger">
              <Trash2 size={16} />
            </Button>
          </div>
        )
      default:
        return patch[columnKey]
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">补丁管理</h1>
        <Chip color="primary" variant="flat">
          太无聊了不想写了。。。
        </Chip>
      </div>

      <Table
        aria-label="Patches table"
        bottomContent={
          <div className="flex justify-center w-full">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={page}
              total={10}
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
        <TableBody items={patches}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey.toString())}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}