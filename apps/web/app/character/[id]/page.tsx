import { kunServerGet } from '~/utils/actions/kunServerFetch'
import { CharDetailContainer } from '~/components/character/detail/Container'
import { generateNullMetadata } from '~/utils/noIndex'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Metadata } from 'next'

export const generateMetadata = async (): Promise<Metadata> => {
  return generateNullMetadata('角色详情')
}

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const response = await kunServerGet<any>('/character/' + id)

    return <CharDetailContainer char={response} />
  } catch (error) {
    return <ErrorComponent error={(error as Error).message} />
  }
}
