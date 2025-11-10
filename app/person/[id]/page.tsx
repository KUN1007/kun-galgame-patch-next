import { getPersonById } from '~/app/api/person/route'
import { PersonDetailContainer } from '~/components/person/detail/Container'
import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'
import { ErrorComponent } from '~/components/error/ErrorComponent'

export const generateMetadata = async (): Promise<Metadata> => {
  return generateNullMetadata('制作人')
}

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const response = await getPersonById({ personId: Number(id) })

  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return <PersonDetailContainer person={response} />
}
