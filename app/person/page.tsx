import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { PersonContainer } from '~/components/person/Container'
import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'

export const revalidate = 5

export const generateMetadata = async (): Promise<Metadata> => {
  return generateNullMetadata('制作人列表')
}

export default async function Kun() {
  const response = await kunGetActions({ page: 1, limit: 72 })
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
