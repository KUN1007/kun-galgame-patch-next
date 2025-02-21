import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/markdownToHtml'
import type { PatchIntroduction } from '~/types/api/patch'

const patchIdSchema = z.object({
  patchId: z.coerce
    .number({ message: '补丁 ID 必须为数字' })
    .min(1)
    .max(9999999)
})

export const getPatchIntroduction = async (
  input: z.infer<typeof patchIdSchema>
) => {
  const { patchId } = input

  const patch = await prisma.patch.findUnique({
    where: { id: patchId },
    include: {
      alias: {
        select: {
          name: true
        }
      },
      tag: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              count: true,
              alias: true
            }
          }
        }
      },
      company: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              count: true,
              alias: true
            }
          }
        }
      }
    }
  })
  if (!patch) {
    return '未找到对应补丁'
  }

  const response: PatchIntroduction = {
    vndbId: patch.vndb_id,
    introduction: await markdownToHtml(patch.introduction),
    released: patch.released,
    alias: patch.alias.map((a) => a.name),
    tag: patch.tag.map((tag) => tag.tag),
    company: patch.company.map((company) => company.company),
    created: String(patch.created),
    updated: String(patch.updated)
  }

  return response
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchIntroduction(input)
  return NextResponse.json(response)
}
