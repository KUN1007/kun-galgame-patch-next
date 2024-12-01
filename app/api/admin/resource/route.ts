import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import type { AdminResource } from '~/types/api/admin'

export const getPatchResource = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.patch_resource.findMany({
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    }),
    await prisma.patch_resource.count()
  ])

  const resources: AdminResource[] = data.map((resource) => ({
    id: resource.id,
    patchId: resource.patch_id,
    patchName: resource.patch.name,
    storage: resource.storage,
    user: resource.user,
    size: resource.size,
    created: resource.created
  }))

  return { resources, total }
}

export async function GET(req: NextRequest) {
  const input = kunParseGetQuery(req, adminPaginationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  return NextResponse.json(getPatchResource(input))
}
