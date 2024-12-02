'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  useDisclosure
} from '@nextui-org/react'
import { Edit2, Trash2 } from 'lucide-react'
import { useUserStore } from '~/store/providers/user'
import type { AdminResource } from '~/types/api/admin'

interface Props {
  initialResource: AdminResource
}

export const ResourceEdit = ({ initialResource }: Props) => {
  const [resource, setResource] = useState<AdminResource>(initialResource)
  const currentUser = useUserStore((state) => state.user)

  return (
    <>
      <div className="flex gap-2">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          isDisabled={currentUser.role < 3}
        >
          <Edit2 size={16} />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          isDisabled={currentUser.role < 3}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </>
  )
}
