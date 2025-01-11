import { ErrorComponent } from '~/components/error/ErrorComponent'
import { TagDetailContainer } from '~/components/tag/detail/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type { TagDetail } from '~/types/api/tag'

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const tag = await kunServerFetchGet<TagDetail>('/tag', {
    tagId: Number(id)
  })
  return generateKunMetadataTemplate(tag)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const tag = await kunServerFetchGet<KunResponse<TagDetail>>('/tag', {
    tagId: Number(id)
  })
  if (typeof tag === 'string') {
    return <ErrorComponent error={tag} />
  }

  const { galgames, total } = await kunServerFetchGet<{
    galgames: GalgameCard[]
    total: number
  }>('/tag/galgame', {
    tagId: Number(id),
    page: 1,
    limit: 24
  })

  return (
    <TagDetailContainer
      initialTag={tag}
      initialPatches={galgames}
      total={total}
    />
  )
}
