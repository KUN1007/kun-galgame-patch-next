import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma'
import { getPatchByCompanySchema } from '~/validations/company'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'

export const getPatchByCompany = async (
  input: z.infer<typeof getPatchByCompanySchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { companyId, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_company_relation.findMany({
      where: { company_id: companyId, patch: nsfwEnable },
      select: {
        patch: {
          select: GalgameCardSelectField
        }
      },
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.patch_company_relation.count({
      where: { company_id: companyId, patch: nsfwEnable }
    })
  ])

  const galgames: GalgameCard[] = data.map((p) => ({
    ...p.patch,
    name: {
      'en-us': p.patch.name_en_us,
      'ja-jp': p.patch.name_ja_jp,
      'zh-cn': p.patch.name_zh_cn
    }
  }))

  return { galgames, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getPatchByCompanySchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const nsfwEnable = getNSFWHeader(req)

  const response = await getPatchByCompany(input, nsfwEnable)
  return NextResponse.json(response)
}
