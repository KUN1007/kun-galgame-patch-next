import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma'
import { getPatchByCompanySchema } from '~/validations/company'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'

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
          select: {
            id: true,
            name: true,
            banner: true,
            view: true,
            download: true,
            type: true,
            language: true,
            platform: true,
            created: true,
            _count: {
              select: {
                favorite_by: true,
                contribute_by: true,
                resource: true,
                comment: true
              }
            }
          }
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
