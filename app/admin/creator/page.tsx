'use client'

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Chip
} from '@nextui-org/react'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'

type Application = {
  id: string
  user: {
    name: string
    email: string
  }
  status: string
  description: string
  experience: string
  createdAt: string
  reason?: string
}

export default function Kun() {
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/creator-applications')
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/creator-applications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          reason: action === 'reject' ? rejectReason : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to update application')

      fetchApplications()
      onClose()
      setRejectReason('')
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'rejected':
        return 'danger'
      default:
        return 'warning'
    }
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Creator Applications</h1>
      <Table aria-label="Creator applications">
        <TableHeader>
          <TableColumn>APPLICANT</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>SUBMITTED</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{app.user.name}</p>
                  <p className="text-gray-500 text-small">{app.user.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  color={getStatusColor(app.status)}
                  variant="flat"
                  size="sm"
                >
                  {app.status.toUpperCase()}
                </Chip>
              </TableCell>
              <TableCell>{formatDistanceToNow(app.createdAt)}</TableCell>
              <TableCell>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="success"
                      onClick={() => handleAction(app.id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      onClick={() => {
                        setSelectedApp(app)
                        onOpen()
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Reject Application</ModalHeader>
          <ModalBody>
            <Textarea
              label="Reason for rejection"
              placeholder="Please provide a reason for rejecting this application..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() =>
                selectedApp && handleAction(selectedApp.id, 'reject')
              }
            >
              Reject Application
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
