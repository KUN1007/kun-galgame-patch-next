import { serverApi } from '~/lib/trpc-server'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { TagDetailCOntainer } from '~/components/tag/detail/Container'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const tag = await serverApi.tag.getTagById.query({ tagId: Number(id) })

  if (typeof tag === 'string') {
    return <ErrorComponent error={tag} />
  }

  const { patches, total } = await serverApi.tag.getPatchByTag.query({
    tagId: Number(id),
    page: 1,
    limit: 24
  })

  return <TagDetailCOntainer tag={tag} initialPatches={patches} total={total} />
}
