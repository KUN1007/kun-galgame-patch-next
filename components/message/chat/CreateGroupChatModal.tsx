'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Tabs,
  Tab,
  Input,
  Button
} from '@heroui/react'
import { kunFetchPost } from '~/utils/kunFetch'
import { kunFetchGet } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import type { JoinChatRoomResponse } from '~/types/api/chat'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const CreateGroupChatModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter()
  const [searchedUsers, setSearchedUsers] = useState<KunUser[]>([])
  const [loading, startTransition] = useTransition()

  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    watch: submitWatch
  } = useForm({
    defaultValues: { name: '', link: '', avatar: '', members: [] as KunUser[] }
  })
  const {
    control: joinControl,
    handleSubmit: handleJoinSubmit,
    watch: joinWatch
  } = useForm({
    defaultValues: { link: 'kun' }
  })

  const handleUserSearch = async (query: string) => {
    if (!query) return
    const users = await kunFetchGet<KunUser[]>(`/users/search`, { query })
    if (typeof users !== 'string') {
      setSearchedUsers(users)
    }
  }

  const onCreateGroup = async (data: {
    name: string
    link: string
    avatar: string
    members: KunUser[]
  }) => {
    startTransition(async () => {
      const memberIdArray = data.members.map((m) => m.id)
      const res = await kunFetchPost<KunResponse<{}>>('/chat-room', {
        ...data,
        memberIdArray
      })
      kunErrorHandler(res, () => {
        toast.success(`群聊 "${submitWatch().name}" 创建成功!`)
        onClose()
        router.push(`/message/chat/${submitWatch().link}`)
      })
    })
  }

  const onJoinGroup = async (data: { link: string }) => {
    startTransition(async () => {
      const res = await kunFetchPost<KunResponse<JoinChatRoomResponse>>(
        `/chat-room/join`,
        { link: data.link }
      )

      kunErrorHandler(res, (value) => {
        toast.success(`成功加入群聊 "${value.name}"!`)
        onClose()
        router.push(`/message/chat/${value.link}`)
      })
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2>创建或加入群聊</h2>
              <p className="font-normal text-sm text-default-500">
                目前由于我摆烂的原因, 只有超级管理员才可以创建群聊!
                因为懒得写代码了 (别打我呜呜呜, 有空就写, 嗯, 下次一定) !
                <br />
                加入群聊中已经为大家提供了一个网站的公共群组,
                快点击加入来聊天吧~
              </p>
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

                    <Controller
                      name="link"
                      control={createControl}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="群组链接 (3 ~ 17 个字母或数字)"
                          isRequired
                        />
                      )}
                    />

                    <Controller
                      name="avatar"
                      control={createControl}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Input {...field} label="群聊的头像链接" isRequired />
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
                      isLoading={loading}
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
                      isLoading={loading}
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
