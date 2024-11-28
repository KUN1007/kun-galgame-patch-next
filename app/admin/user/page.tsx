'use client'

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Button,
  Pagination
} from '@nextui-org/react'
import { Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'

const users = [
  {
    id: 1,
    name: 'Tony Reichert',
    email: 'tony.reichert@example.com',
    role: 'admin',
    status: 'active',
    registerTime: '2024-01-01'
  },
  {
    id: 2,
    name: 'Zoey Lang',
    email: 'zoey.lang@example.com',
    role: 'user',
    status: 'suspended',
    registerTime: '2024-02-15'
  }
]

const columns = [
  { name: 'USER', uid: 'user' },
  { name: 'ROLE', uid: 'role' },
  { name: 'STATUS', uid: 'status' },
  { name: 'ACTIONS', uid: 'actions' }
]

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const rowsPerPage = 10

  const renderCell = (user: any, columnKey: string) => {
    switch (columnKey) {
      case 'user':
        return (
          <User
            name={user.name}
            description={user.email}
            avatarProps={{
              src: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`
            }}
          />
        )
      case 'role':
        return (
          <Chip
            color={user.role === 'admin' ? 'primary' : 'default'}
            variant="flat"
          >
            {user.role}
          </Chip>
        )
      case 'status':
        return (
          <Chip
            color={user.status === 'active' ? 'success' : 'danger'}
            variant="flat"
          >
            {user.status}
          </Chip>
        )
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button isIconOnly size="sm" variant="light">
              <Edit2 size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" color="danger">
              <Trash2 size={16} />
            </Button>
          </div>
        )
      default:
        return user[columnKey]
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <Button color="primary">Add New User</Button>
      </div>

      <Table
        aria-label="Users table"
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
        <TableBody items={users}>
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
