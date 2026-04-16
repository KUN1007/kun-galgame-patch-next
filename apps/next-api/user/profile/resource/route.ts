import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import type { UserResource } from '~/types/api/user'

export const getUserPatchResource = async (
  input: z.infer<typeof getUserInfoSchema>
) => {
  const { uid, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_resource.findMany({
      where: { user_id: uid },
      include: {
        patch: true
      },
      orderBy: { created: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.patch_resource.count({
      where: { user_id: uid }
    })
  ])

  const resources: UserResource[] = data.map((res) => ({
    id: res.id,
    patchId: res.patch.id,
    patchName: {
      'en-us': res.patch.name_en_us,
      'ja-jp': res.patch.name_ja_jp,
      'zh-cn': res.patch.name_zh_cn
    },
    patchBanner: res.patch.banner,
    size: res.size,
    type: res.type,
    language: res.language,
    platform: res.platform,
    created: String(res.created)
  }))

  return { resources, total }
}

export async function GET(req: NextRequest) {
  const input = kunParseGetQuery(req, getUserInfoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getUserPatchResource(input)
  return NextResponse.json(response)
}
