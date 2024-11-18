'use client'

import { useEffect, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/modal'
import { Button } from '@nextui-org/button'
import { Chip } from '@nextui-org/chip'
import { Checkbox } from '@nextui-org/checkbox'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { Link } from '@nextui-org/link'
import { Tag } from 'lucide-react'
import { useMounted } from '~/hooks/useMounted'
import { api } from '~/lib/trpc-client'
import { useDebounce } from 'use-debounce'
import { SearchTags } from '~/components/tag/SearchTag'
import { KunLoading } from '~/components/kun/Loading'
import type { Tag as TagType } from '~/types/api/tag'

interface Props {
  patchId: number
  initialTags: TagType[]
  onTagsAdded: (tags: TagType[]) => void
}

export const PatchTagSelector = ({
  patchId,
  initialTags,
  onTagsAdded
}: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [tags, setTags] = useState<TagType[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [existingTags, setExistingTags] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()

  const fetchTags = async () => {
    setLoading(true)
    const response = await api.tag.getTag.query({
      page: 1,
      limit: 100
    })
    setTags(response.tags)

    const ids1 = initialTags.map((tag) => tag.id)
    const ids2 = response.tags.map((tag) => tag.id)
    const commonIds = ids1.filter((id) => ids2.includes(id))
    setExistingTags(commonIds)

    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchTags()
  }, [])

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    } else {
      fetchTags()
    }
  }, [debouncedQuery])

  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setSearching(true)
    const response = await api.tag.searchTag.mutate({
      query: query.split(' ').filter((term) => term.length > 0)
    })
    setTags(response)
    setSearching(false)
  }

  const handleSubmit = async () => {
    if (!selectedTags.length) {
      return
    }

    setIsLoading(true)
    await api.patch.handleAddPatchTag.mutate({
      patchId,
      tagId: selectedTags
    })

    setSelectedTags([])
    onTagsAdded(tags.filter((t) => selectedTags.includes(t.id)))
    onClose()
    setIsLoading(false)
  }

  return (
    <div>
      <Button
        onPress={onOpen}
        color="primary"
        variant="bordered"
        startContent={<Tag size={20} />}
      >
        更改标签
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>更改这个 Galgame 的标签</ModalHeader>
          <ModalBody>
            <SearchTags
              query={query}
              setQuery={setQuery}
              handleSearch={handleSearch}
              searching={searching}
            />

            {!searching && (
              <ScrollShadow className="max-h-[400px]">
                {loading ? (
                  <KunLoading hint="正在获取标签数据..." />
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-default-100"
                      >
                        <Checkbox
                          isDisabled={existingTags.includes(tag.id)}
                          isSelected={selectedTags.includes(tag.id)}
                          onValueChange={(checked) => {
                            setSelectedTags(
                              checked
                                ? [...selectedTags, tag.id]
                                : selectedTags.filter((id) => id !== tag.id)
                            )
                          }}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{tag.name}</span>
                              <Chip size="sm" variant="flat">
                                {tag.count} 个补丁
                              </Chip>
                            </div>
                          </div>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollShadow>
            )}
          </ModalBody>
          <ModalFooter className="flex-col">
            <div className="ml-auto space-x-2">
              <Button variant="flat" onPress={onClose}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={selectedTags.length === 0}
              >
                添加选中标签
              </Button>
            </div>
            <div>
              没有您想要的标签?{' '}
              <Link color="primary" showAnchorIcon href="/tag">
                去创建标签
              </Link>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
