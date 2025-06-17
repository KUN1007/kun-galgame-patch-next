'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  Input,
  Button,
  Autocomplete,
  AutocompleteItem,
  Avatar
} from '@heroui/react'
import { kunFetchPost } from '~/utils/kunFetch'
import { kunFetchGet } from '~/utils/kunFetch'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const CreateGroupChatModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter()
  const [searchedUsers, setSearchedUsers] = useState<KunUser[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { control: createControl, handleSubmit: handleCreateSubmit } = useForm({
    defaultValues: { name: '', members: [] as KunUser[] }
  })
  const { control: joinControl, handleSubmit: handleJoinSubmit } = useForm({
    defaultValues: { link: '' }
  })

  const handleUserSearch = async (query: string) => {
    if (!query) return
    const users = await kunFetchGet<KunUser[]>(`/api/users/search`, { query })
    if (typeof users !== 'string') {
      setSearchedUsers(users)
    }
  }

  const onCreateGroup = async (data: { name: string; members: KunUser[] }) => {
    setIsLoading(true)
    const memberIdArray = data.members.map((m) => m.id)
    const response = await kunFetchPost<any>('/api/chat-rooms', {
      name: data.name,
      memberIdArray
    })

    if (typeof response === 'string') {
      toast.error(response)
    } else {
      toast.success(`群聊 "${response.name}" 创建成功!`)
      onClose()
      router.push(`/message/chat/${response.link}`)
    }
    setIsLoading(false)
  }

  const onJoinGroup = async (data: { link: string }) => {
    setIsLoading(true)
    const response = await kunFetchPost<any>(`/api/chat-rooms/join`, {
      link: data.link
    })

    if (typeof response === 'string') {
      toast.error(response)
    } else {
      toast.success(`成功加入群聊 "${response.name}"!`)
      onClose()
      router.push(`/message/chat/${response.link}`)
    }
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="top-center">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              创建或加入群聊
            </ModalHeader>
            <ModalBody>
              <Tabs fullWidth>
                <Tab key="create" title="创建群聊">
                  <form
                    onSubmit={handleCreateSubmit(onCreateGroup)}
                    className="space-y-4"
                  >
                    <Controller
                      name="name"
                      control={createControl}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Input {...field} label="群聊名称" isRequired />
                      )}
                    />
                    {/* <Controller
                      name="members"
                      control={createControl}
                      render={({ field }) => (
                        <Autocomplete
                          label="选择群友"
                          allowsCustomValue={false}
                          allowsMultiple
                          onInputChange={handleUserSearch}
                          items={searchedUsers}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys).map((key) =>
                              searchedUsers.find((u) => u.id === Number(key))
                            )
                            field.onChange(selected.filter(Boolean) as user[])
                          }}
                        >
                          {(item) => (
                            <AutocompleteItem
                              key={item.id}
                              textValue={item.name}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={item.avatar}
                                  className="flex-shrink-0"
                                  size="sm"
                                />
                                <span>{item.name}</span>
                              </div>
                            </AutocompleteItem>
                          )}
                        </Autocomplete>
                      )}
                    /> */}
                    <Button
                      type="submit"
                      color="primary"
                      fullWidth
                      isLoading={isLoading}
                    >
                      创建
                    </Button>
                  </form>
                </Tab>
                <Tab key="join" title="加入群聊">
                  <form
                    onSubmit={handleJoinSubmit(onJoinGroup)}
                    className="space-y-4"
                  >
                    <Controller
                      name="link"
                      control={joinControl}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Input {...field} label="群聊链接" isRequired />
                      )}
                    />
                    <Button
                      type="submit"
                      color="primary"
                      fullWidth
                      isLoading={isLoading}
                    >
                      加入
                    </Button>
                  </form>
                </Tab>
              </Tabs>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
