import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { resourceSchema } from '~/validations/resource'
import { markdownToText } from '~/utils/markdownToText'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'
import type { PatchResource } from '~/types/api/resource'

export const getPatchResource = async (
  input: z.infer<typeof resourceSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { sortField, sortOrder, page, limit } = input

  const offset = (page - 1) * limit

  const orderByField =
    sortField === 'like'
      ? { like_by: { _count: sortOrder } }
      : { [sortField]: sortOrder }

  const [resourcesData, total] = await Promise.all([
    prisma.patch_resource.findMany({
      take: limit,
      skip: offset,
      orderBy: orderByField,
      where: { patch: nsfwEnable },
      include: {
        patch: {
          select: {
            name: true
          }
        },
        user: {
          include: {
            _count: {
              select: { patch_resource: true }
            }
          }
        },
        _count: {
          select: {
            like_by: true
          }
        }
      }
    }),
    prisma.patch_resource.count()
  ])

  const resources: PatchResource[] = resourcesData.map((resource) => ({
    id: resource.id,
    storage: resource.storage,
    name: resource.name,
    modelName: resource.model_name,
    size: resource.size,
    type: resource.type,
    language: resource.language,
    note: markdownToText(resource.note).slice(0, 233),
    platform: resource.platform,
    likeCount: resource._count.like_by,
    download: resource.download,
    patchId: resource.patch_id,
    patchName: resource.patch.name,
    created: String(resource.created),
    updateTime: resource.update_time,
    user: {
      id: resource.user.id,
      name: resource.user.name,
      avatar: resource.user.avatar,
      patchCount: resource.user._count.patch_resource
    }
  }))

  return { resources, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, resourceSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const nsfwEnable = getNSFWHeader(req)

  const response = await getPatchResource(input, nsfwEnable)
  return NextResponse.json(response)
}
