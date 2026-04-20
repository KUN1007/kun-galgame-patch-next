import { kunServerGet } from '~/utils/actions/kunServerFetch'
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

  try {
    const response = await kunServerGet<any>('/person/' + id)

    return <PersonDetailContainer person={response} />
  } catch (error) {
    return <ErrorComponent error={(error as Error).message} />
  }
}
