import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Metadata } from 'next'
import { PersonContainer } from '~/components/person/Container'
import { kunMetadata } from './metadata'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

export default async function PersonIndex() {
  const response = await kunGetActions({ page: 1, limit: 100 })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }
  return (
    <PersonContainer
      initialPersons={response.persons}
      initialTotal={response.total}
    />
  )
}
