import { getCharacterById } from '~/app/api/character/route'
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
  const response = await getCharacterById({ characterId: Number(id) })

  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return <CharDetailContainer char={response} />
}
