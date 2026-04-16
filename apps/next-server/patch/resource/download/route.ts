import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { updatePatchResourceStatsSchema } from '~/validations/patch'

export const downloadStats = async (
  input: z.infer<typeof updatePatchResourceStatsSchema>
) => {
  return await prisma.$transaction(async (prisma) => {
    await prisma.patch.update({
      where: { id: input.patchId },
      data: { download: { increment: 1 } }
    })

    await prisma.patch_resource.update({
      where: { id: input.resourceId },
      data: { download: { increment: 1 } }
    })
    return {}
  })
}

export const PUT = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, updatePatchResourceStatsSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await downloadStats(input)
  return NextResponse.json(response)
}
