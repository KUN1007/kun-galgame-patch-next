import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const getPatchContributor = async (
  input: z.infer<typeof patchIdSchema>
) => {
  const { patchId } = input

  const data = await prisma.user_patch_contribute_relation.findMany({
    where: { patch_id: patchId },
    include: {
      user: true
    },
    orderBy: { created: 'desc' }
  })

  const contributors: KunUser[] = data.map((c) => ({
    id: c.user.id,
    name: c.user.name,
    avatar: c.user.avatar
  }))

  return contributors
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchContributor(input)
  return NextResponse.json(response)
}
