'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@nextui-org/pagination'
import { api } from '~/lib/trpc-client'
import { Chip } from '@nextui-org/chip'
import { Button } from '@nextui-org/button'
import { useDisclosure } from '@nextui-org/modal'
import { Pencil } from 'lucide-react'
import { TagDetail } from '~/types/api/tag'
import { KunLoading } from '~/components/kun/Loading'
import { KunHeader } from '~/components/kun/Header'
import { useMounted } from '~/hooks/useMounted'
import { SearchCard } from '~/components/search/Card'
import { motion } from 'framer-motion'
import { cardContainer, cardItem } from '~/motion/card'
import { KunNull } from '~/components/kun/Null'
import { EditTagModal } from './EditTagModel'
import { useRouter } from 'next/navigation'

interface Props {
  initialTag: TagDetail
  initialPatches: GalgameCard[]
  total: number
}

export const TagDetailCOntainer = ({
  initialTag,
  initialPatches,
  total
}: Props) => {
  const isMounted = useMounted()
  const router = useRouter()
  const [page, setPage] = useState(1)

  const [tag, setTag] = useState(initialTag)
  const [patches, setPatches] = useState<GalgameCard[]>(initialPatches)
  const [loading, setLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const fetchPatches = async () => {
    setLoading(true)
    const { patches } = await api.tag.getPatchByTag.query({
      tagId: tag.id,
      page,
      limit: 24
    })
    setPatches(patches)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchPatches()
  }, [page])

  return (
    <div className="w-full my-8">
      <KunHeader
        name={tag.name}
        description={tag.introduction}
        headerEndContent={
          <Chip size="lg" color="primary">
            {tag.count} 个补丁
          </Chip>
        }
        endContent={
          <>
            <Button
              variant="flat"
              color="primary"
              onPress={onOpen}
              startContent={<Pencil />}
            >
              编辑该标签
            </Button>
            <EditTagModal
              tag={tag}
              isOpen={isOpen}
              onClose={onClose}
              onSuccess={(newTag) => {
                setTag(newTag)
                onClose()
                router.refresh()
              }}
            />
          </>
        }
      />

      {tag.alias.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">别名</h2>
          <div className="flex flex-wrap gap-2">
            {tag.alias.map((alias, index) => (
              <Chip key={index} variant="flat" color="secondary">
                {alias}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <KunLoading hint="正在获取 Galgame 中..." />
      ) : (
        <motion.div variants={cardContainer} initial="hidden" animate="show">
          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
            {patches.map((patch) => (
              <motion.div key={patch.id} variants={cardItem}>
                <SearchCard patch={patch} />
              </motion.div>
            ))}
          </div>

          {total > 24 && (
            <div className="flex justify-center">
              <Pagination
                total={Math.ceil(total / 24)}
                page={page}
                onChange={(newPage: number) => {
                  setPage(newPage)
                  fetchPatches()
                }}
                showControls
                size="lg"
                radius="lg"
                classNames={{
                  wrapper: 'gap-2',
                  item: 'w-10 h-10'
                }}
              />
            </div>
          )}

          {!total && <KunNull message="这个标签暂无补丁使用" />}
        </motion.div>
      )}
    </div>
  )
}
