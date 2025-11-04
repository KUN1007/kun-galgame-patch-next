import { notFound } from 'next/navigation'
import { z } from 'zod'
import type { Metadata } from 'next'
import { getCharacterById } from '~/app/api/character/route'
import { CharDetailContainer } from '~/components/character/detail/Container'
import { generateKunMetadataTemplate } from './metadata'

const paramsSchema = z.object({ id: z.coerce.number().min(1) })

export default async function CharDetailPage({
  params
}: {
  params: { id: string }
}) {
  const parsed = paramsSchema.safeParse(params)
  if (!parsed.success) notFound()
  const data = await getCharacterById({ characterId: parsed.data.id })
  if (typeof data === 'string') notFound()
  return <CharDetailContainer char={data} />
}

export const generateMetadata = async ({
  params
}: {
  params: { id: string }
}): Promise<Metadata> => {
  const parsed = paramsSchema.safeParse(params)
  if (!parsed.success) return {}
  const data = await getCharacterById({ characterId: parsed.data.id })
  if (typeof data === 'string') return {}
  return generateKunMetadataTemplate(data)
}
