'use client'

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  ModalFooter,
  Textarea,
  Button
} from '@heroui/react'
import type { ChatMessage as ChatMessageType } from '~/types/api/chat'

interface EditMessageModalProps {
  isOpen: boolean
  onClose: () => void
  editingMessage: ChatMessageType | null
  setEditingMessage: (msg: ChatMessageType) => void
  onSave: () => void
}

export const EditMessageModal = ({
  isOpen,
  onClose,
  editingMessage,
  setEditingMessage,
  onSave
}: EditMessageModalProps) => {
  if (!editingMessage) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex-col space-y-2">
          <h3 className="text-lg">重新编辑消息</h3>
          <p className="text-sm font-medium text-default-500">
            系统不会显示您编辑之前的消息, 但是消息的时间前会增加 “已编辑” 提示
          </p>
        </ModalHeader>
        <ModalBody>
          <Textarea
            value={editingMessage.contentMarkdown}
            onValueChange={(value) =>
              setEditingMessage({ ...editingMessage, contentMarkdown: value })
            }
            autoFocus
            minRows={1}
          />
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="light" color="danger" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={onSave}>
              保存
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
