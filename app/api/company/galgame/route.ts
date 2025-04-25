import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma'
import { getPatchByCompanySchema } from '~/validations/company'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { GalgameCardSelectField } from '~/constants/api/select'

export const getPatchByCompany = async (
  input: z.infer<typeof getPatchByCompanySchema>
) => {
  const { companyId, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_company_relation.findMany({
      where: { company_id: companyId },
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
      where: { company_id: companyId }
    })
  ])

  const galgames = data.map((p) => p.patch)

  return { galgames, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getPatchByCompanySchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchByCompany(input)
  return NextResponse.json(response)
}
