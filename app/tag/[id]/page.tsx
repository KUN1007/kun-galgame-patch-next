import { TagDetailContainer } from '~/components/tag/detail/Container'
import { generateKunMetadataTemplate } from './metadata'
import { kunGetTagByIdActions, kunTagGalgameActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Metadata } from 'next'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const tag = await kunGetTagByIdActions({ tagId: Number(id) })
  if (typeof tag === 'string') {
    return {}
  }
  return generateKunMetadataTemplate(tag)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const tag = await kunGetTagByIdActions({ tagId: Number(id) })
  if (typeof tag === 'string') {
    return <ErrorComponent error={tag} />
  }

  const response = await kunTagGalgameActions({
    tagId: Number(id),
    page: 1,
    limit: 24
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <TagDetailContainer
      initialTag={tag}
      initialPatches={response.galgames}
      total={response.total}
    />
  )
}
