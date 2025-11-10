import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { CharContainer } from '~/components/character/Container'
import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'

export const revalidate = 5

export const generateMetadata = async (): Promise<Metadata> => {
  return generateNullMetadata('角色列表')
}

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
