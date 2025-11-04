import { notFound } from 'next/navigation'
import { z } from 'zod'
import type { Metadata } from 'next'
import { getPersonById } from '~/app/api/person/route'
import { PersonDetailContainer } from '~/components/person/detail/Container'
import { generateKunMetadataTemplate } from './metadata'

const paramsSchema = z.object({ id: z.coerce.number().min(1) })

export default async function PersonDetailPage({
  params
}: {
  params: { id: string }
}) {
  const parsed = paramsSchema.safeParse(params)
  if (!parsed.success) notFound()
  const data = await getPersonById({ personId: parsed.data.id })
  if (typeof data === 'string') notFound()
  return <PersonDetailContainer person={data} />
}

export const generateMetadata = async ({
  params
}: {
  params: { id: string }
}): Promise<Metadata> => {
  const parsed = paramsSchema.safeParse(params)
  if (!parsed.success) return {}
  const data = await getPersonById({ personId: parsed.data.id })
  if (typeof data === 'string') return {}
  return generateKunMetadataTemplate(data)
}
