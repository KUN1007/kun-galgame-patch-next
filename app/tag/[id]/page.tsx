import { ErrorComponent } from '~/components/error/ErrorComponent'
import { TagDetailCOntainer } from '~/components/tag/detail/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { TagDetail } from '~/types/api/tag'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const tag = await kunFetchGet<KunResponse<TagDetail>>('/tag', {
    tagId: Number(id)
  })
  if (typeof tag === 'string') {
    return <ErrorComponent error={tag} />
  }

  const { galgames, total } = await kunFetchGet<{
    galgames: GalgameCard[]
    total: number
  }>('/tag/galgame', {
    tagId: Number(id),
    page: 1,
    limit: 24
  })

  return (
    <TagDetailCOntainer
      initialTag={tag}
      initialPatches={galgames}
      total={total}
    />
  )
}
