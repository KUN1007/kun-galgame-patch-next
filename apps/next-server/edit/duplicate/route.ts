import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { duplicateSchema } from '~/validations/edit'

export const duplicate = async (input: z.infer<typeof duplicateSchema>) => {
  const patch = await prisma.patch.findFirst({
    where: { vndb_id: input.vndbId }
  })
  if (patch) {
    return { patchId: patch.id }
  }
  return {}
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, duplicateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await duplicate(input)
  return NextResponse.json(response)
}
