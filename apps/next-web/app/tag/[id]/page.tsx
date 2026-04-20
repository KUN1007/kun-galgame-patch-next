import { TagDetailContainer } from '~/components/tag/detail/Container'
import { generateKunMetadataTemplate } from './metadata'
import { kunGetTagByIdActions, kunTagGalgameActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { pageSearchParamsCache } from '~/components/nuqs/page'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { Metadata } from 'next'
import type { SearchParams } from 'nuqs/server'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
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

export default async function Kun({ params, searchParams }: Props) {
  const { id } = await params
  const { page } = await pageSearchParamsCache.parse(searchParams)

  const tag = await kunGetTagByIdActions({ tagId: Number(id) })
  if (typeof tag === 'string') {
    return <ErrorComponent error={tag} />
  }

  const response = await kunTagGalgameActions({
    tagId: Number(id),
    page,
    limit: 24
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <NuqsAdapter>
      <TagDetailContainer
        initialTag={tag}
        initialPatches={response.galgames}
        total={response.total}
      />
    </NuqsAdapter>
  )
}
