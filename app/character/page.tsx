import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Metadata } from 'next'
import { CharContainer } from '~/components/character/Container'
import { kunMetadata } from './metadata'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

export default async function CharIndex() {
  const response = await kunGetActions({ page: 1, limit: 72 })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }
  return (
    <CharContainer
      initialChars={response.chars}
      initialTotal={response.total}
    />
  )
}
