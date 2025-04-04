import { CardContainer } from '~/components/galgame/Container'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunMetadata } from './metadata'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

interface Props {
  searchParams?: Promise<{ page?: number }>
}

export default async function Kun({ searchParams }: Props) {
  const res = await searchParams
  const currentPage = res?.page ? res.page : 1

  const response = await kunGetActions({
    selectedType: 'all',
    sortField: 'resource_update_time',
    sortOrder: 'desc',
    page: currentPage,
    limit: 24,
    yearString: JSON.stringify(['all']),
    monthString: JSON.stringify(['all'])
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <Suspense>
      <CardContainer
        initialGalgames={response.galgames}
        initialTotal={response.total}
      />
    </Suspense>
  )
}
