'use client'

import { useState, useEffect } from 'react'
import { Chip } from '@nextui-org/chip'
import { Button } from '@nextui-org/button'
import { Card, CardBody } from '@nextui-org/card'
import { Snippet } from '@nextui-org/snippet'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/dropdown'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/modal'
import { User } from '@nextui-org/user'
import { Link } from '@nextui-org/link'
import { MoreHorizontal, Plus, Download, Edit, Trash } from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { PublishResource } from './PublishResource'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { EditResourceDialog } from './EditResourceDialog'
import { useUserStore } from '~/store/userStore'
import { ResourceLikeButton } from './ResourceLike'
import type { PatchResource } from '~/types/api/patch'
import toast from 'react-hot-toast'

export const Resources = ({ id }: { id: number }) => {
  const [resources, setResources] = useState<PatchResource[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showLinks, setShowLinks] = useState<Record<number, boolean>>({})

  const fetchResources = async () => {
    const res = await api.patch.getPatchResource.query({
      patchId: Number(id)
    })
    setResources(res)
  }

  useEffect(() => {
    fetchResources()
  }, [id])

  const toggleLinks = (resourceId: number) => {
    setShowLinks((prev) => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }))
  }

  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit
  } = useDisclosure()
  const { user } = useUserStore()
  const [editResource, setEditResource] = useState<PatchResource | null>(null)
  const completeEdit = () => {
    onCloseEdit()
    setEditResource(null)
    toast.success('编辑资源链接成功')
  }

  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete
  } = useDisclosure()
  const [deleteResourceId, setDeleteResourceId] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const handleDeleteResource = async () => {
    setDeleting(true)
    await api.patch.deleteResource.mutate({ resourceId: deleteResourceId })
    setResources((prev) =>
      prev.filter((resource) => resource.id !== deleteResourceId)
    )
    setDeleteResourceId(0)
    setDeleting(false)
    onCloseDelete()
    toast.success('删除资源链接成功')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="solid"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => setShowCreate(!showCreate)}
        >
          添加资源
        </Button>
      </div>

      {showCreate && (
        <PublishResource
          patchId={id}
          onSuccess={(res) => {
            setShowCreate(false)
            setResources([...resources, res])
          }}
        />
      )}

      {resources.map((resource) => (
        <Card key={resource.id}>
          <CardBody className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {resource.type.map((type) => (
                    <Chip key={type} variant="flat">
                      {type}
                    </Chip>
                  ))}
                  {resource.language.map((lang) => (
                    <Chip key={lang} variant="bordered">
                      {lang}
                    </Chip>
                  ))}
                  {<Chip variant="flat">{resource.size}</Chip>}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Snippet
                    tooltipProps={{
                      content: '点击复制提取码'
                    }}
                    size="sm"
                    symbol="提取码"
                    color="primary"
                    className="py-0"
                  >
                    {resource.code}
                  </Snippet>

                  <Snippet
                    tooltipProps={{
                      content: '点击复制解压码'
                    }}
                    size="sm"
                    symbol="解压码"
                    color="primary"
                    className="py-0"
                  >
                    {resource.password}
                  </Snippet>
                </div>

                {resource.note && <p className="mt-2">{resource.note}</p>}
              </div>

              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light" isIconOnly>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Resource actions"
                  disabledKeys={
                    user.uid === resource.userId ? [] : ['edit', 'delete']
                  }
                >
                  <DropdownItem
                    key="edit"
                    startContent={<Edit className="w-4 h-4" />}
                    onPress={() => {
                      onOpenEdit()
                      setEditResource(resource)
                    }}
                  >
                    编辑
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<Trash className="w-4 h-4" />}
                    onPress={() => {
                      onOpenDelete()
                      setDeleteResourceId(resource.id)
                    }}
                  >
                    删除
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>

            <div className="flex justify-between">
              <User
                name={resource.user.name}
                description={`${formatDistanceToNow(resource.created)} • 已发布补丁 ${resource.user.patchCount} 个`}
                avatarProps={{
                  showFallback: true,
                  src: resource.user.avatar,
                  name: resource.user.name.charAt(0).toUpperCase()
                }}
              />

              <div className="flex gap-2">
                <ResourceLikeButton
                  resourceId={resource.id}
                  likedBy={resource.likedBy}
                  publisher={resource.user}
                />
                <Button
                  color="primary"
                  variant="flat"
                  isIconOnly
                  onPress={() => toggleLinks(resource.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showLinks[resource.id] && (
              <div className="flex flex-wrap gap-2 mt-4">
                {resource.link.map((link, index) => (
                  <Button
                    key={index}
                    as={Link}
                    href={link}
                    showAnchorIcon
                    color="primary"
                    variant="solid"
                  >
                    下载链接 {index + 1}
                  </Button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ))}

      <Modal size="3xl" isOpen={isOpenEdit} onClose={completeEdit}>
        <EditResourceDialog
          onClose={completeEdit}
          resource={editResource}
          onSuccess={(res) => {
            setResources((prevResources) =>
              prevResources.map((resource) =>
                resource.id === res.id ? res : resource
              )
            )
          }}
        />
      </Modal>

      <Modal isOpen={isOpenDelete} onClose={onCloseDelete} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            删除资源链接
          </ModalHeader>
          <ModalBody>
            <p>
              您确定要删除这条资源链接吗,
              这将会导致您发布资源链接获得的萌萌点被扣除, 该操作不可撤销
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseDelete}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteResource}
              disabled={deleting}
              isLoading={deleting}
            >
              删除
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
