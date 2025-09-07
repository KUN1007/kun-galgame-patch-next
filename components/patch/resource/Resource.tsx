'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/dropdown'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure
} from '@heroui/modal'
import {
  Edit,
  MoreHorizontal,
  Plus,
  Trash2,
  Share,
  Lock,
  LockOpen
} from 'lucide-react'
import { kunFetchDelete, kunFetchPut } from '~/utils/kunFetch'
import { PublishResource } from './publish/PublishResource'
import { EditResourceDialog } from './edit/EditResourceDialog'
import { useUserStore } from '~/store/userStore'
import { ResourceInfo } from './ResourceInfo'
import { ResourceDownload } from './ResourceDownload'
import toast from 'react-hot-toast'
import { kunCopy } from '~/utils/kunCopy'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { PatchResourceHtml } from '~/types/api/patch'

interface Props {
  initialResources: PatchResourceHtml[]
  id: number
}

export const Resources = ({ initialResources, id }: Props) => {
  const [resources, setResources] =
    useState<PatchResourceHtml[]>(initialResources)
  const [windowHash, setWindowHash] = useState('')

  useEffect(() => setWindowHash(window.location.hash), [])

  const {
    isOpen: isOpenCreate,
    onOpen: onOpenCreate,
    onClose: onCloseCreate
  } = useDisclosure()

  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit
  } = useDisclosure()
  const { user } = useUserStore((state) => state)
  const [editResource, setEditResource] = useState<PatchResourceHtml | null>(
    null
  )

  const {
    isOpen: isOpenDelete,
    onOpen: onOpenDelete,
    onClose: onCloseDelete
  } = useDisclosure()
  const [deleteResourceId, setDeleteResourceId] = useState(0)
  const [deleting, startDeleting] = useTransition()
  const handleDeleteResource = async () => {
    startDeleting(async () => {
      await kunFetchDelete<KunResponse<{}>>('/patch/resource', {
        resourceId: deleteResourceId
      })

      setResources((prev) =>
        prev.filter((resource) => resource.id !== deleteResourceId)
      )
      setDeleteResourceId(0)
      onCloseDelete()
      toast.success('删除资源链接成功')
    })
  }

  const {
    isOpen: isOpenDisable,
    onOpen: onOpenDisable,
    onClose: onCloseDisable
  } = useDisclosure()
  const [disableResource, setDisableResource] =
    useState<PatchResourceHtml | null>(null)
  const [disabling, startDisabling] = useTransition()
  const toggleDisableResource = async () => {
    startDisabling(async () => {
      if (!disableResource) {
        return
      }

      const nextStatus = disableResource.status === 0 ? 1 : 0

      await kunFetchPut<KunResponse<{}>>('/patch/resource/disable', {
        resourceId: disableResource.id
      })
      toast.success(
        disableResource.status ? '启用补丁下载成功' : '禁止补丁被下载成功'
      )

      setResources((prev) =>
        prev.map((resource) =>
          resource.id === disableResource.id
            ? { ...resource, status: nextStatus }
            : resource
        )
      )
      setDisableResource(null)
      onCloseDisable()
    })
  }

  const getDisabledKeys = (resource: PatchResourceHtml) => {
    const disabledKeys: string[] = []
    if (user.uid !== resource.userId) {
      disabledKeys.push('edit', 'delete')
    }
    if (user.role < 3) {
      disabledKeys.push('disable')
    }
    return disabledKeys
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="solid"
          startContent={<Plus className="size-4" />}
          onPress={onOpenCreate}
        >
          添加资源
        </Button>
      </div>

      {resources.map((resource) => (
        <Card
          key={resource.id}
          className={
            windowHash === `#kun_patch_resource_${resource.id}`
              ? 'border-primary border-3'
              : ''
          }
        >
          <CardBody className="space-y-2">
            <div className="flex items-start justify-between">
              <ResourceInfo resource={resource} />

              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light" isIconOnly>
                    <MoreHorizontal
                      aria-label="补丁资源操作"
                      className="size-4"
                    />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Resource actions"
                  disabledKeys={getDisabledKeys(resource)}
                >
                  <DropdownItem
                    key="edit"
                    startContent={<Edit className="size-4" />}
                    onPress={() => {
                      setEditResource(resource)
                      onOpenEdit()
                    }}
                  >
                    编辑
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<Trash2 className="size-4" />}
                    onPress={() => {
                      setDeleteResourceId(resource.id)
                      onOpenDelete()
                    }}
                  >
                    删除
                  </DropdownItem>
                  <DropdownItem
                    key="disable"
                    startContent={
                      resource.status ? (
                        <LockOpen className="size-4" />
                      ) : (
                        <Lock className="size-4" />
                      )
                    }
                    onPress={() => {
                      setDisableResource(resource)
                      onOpenDisable()
                    }}
                  >
                    {resource.status ? '启用补丁下载' : '禁止补丁被下载'}
                  </DropdownItem>
                  <DropdownItem
                    key="share"
                    startContent={<Share className="size-4" />}
                    onPress={() => {
                      kunCopy(
                        `${kunMoyuMoe.domain.main}/patch/${resource.patchId}/resource#kun_patch_resource_${resource.id}`
                      )
                    }}
                  >
                    分享
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>

            <ResourceDownload resource={resource} />
          </CardBody>
        </Card>
      ))}

      <Modal
        size="3xl"
        isOpen={isOpenCreate}
        onClose={onCloseCreate}
        scrollBehavior="outside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <PublishResource
          patchId={id}
          onClose={onCloseCreate}
          onSuccess={(res) => {
            setResources([...resources, res])
            onCloseCreate()
          }}
        />
      </Modal>

      <Modal
        size="3xl"
        isOpen={isOpenEdit}
        onClose={onCloseEdit}
        scrollBehavior="outside"
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <EditResourceDialog
          onClose={onCloseEdit}
          resource={editResource!}
          onSuccess={(res) => {
            setResources((prevResources) =>
              prevResources.map((resource) =>
                resource.id === res.id ? res : resource
              )
            )
            onCloseEdit()
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

      <Modal isOpen={isOpenDisable} onClose={onCloseDisable} placement="center">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {disableResource?.status
              ? '启用补丁资源下载'
              : '禁止任何人下载这个补丁资源'}
          </ModalHeader>
          <ModalBody>
            <p>
              {disableResource?.status
                ? '您确定要重新启用这个补丁资源的下载吗'
                : `您确定要禁止任何人下载这个补丁资源吗, 这对于补丁资源可能存在病毒风险时非常有用`}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseDisable}>
              取消
            </Button>
            <Button
              color="danger"
              onPress={toggleDisableResource}
              disabled={disabling}
              isLoading={disabling}
            >
              {disableResource?.status ? '启用' : '禁用'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
