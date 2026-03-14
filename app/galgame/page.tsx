import { CardContainer } from '~/components/galgame/Container'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunMetadata } from './metadata'
import { galgameSearchParamsCache } from '~/components/galgame/_searchParams'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { Metadata } from 'next'
import type { SearchParams } from 'nuqs/server'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function Kun({ searchParams }: Props) {
  const { page, type, sortField, sortOrder, years, months } =
    await galgameSearchParamsCache.parse(searchParams)

  const response = await kunGetActions({
    selectedType: type,
    sortField,
    sortOrder,
    page,
    limit: 24,
    yearString: JSON.stringify(years),
    monthString: JSON.stringify(months)
  })

  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <NuqsAdapter>
      <CardContainer
        initialGalgames={response.galgames}
        initialTotal={response.total}
      />
    </NuqsAdapter>
  )
}
