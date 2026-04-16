import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma'
import {
  createCompanySchema,
  getCompanyByIdSchema
} from '~/validations/company'
import { kunParseGetQuery, kunParsePostBody } from '../utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getEnableOnlyCreatorCreateStatus } from '~/app/api/admin/setting/creator/getEnableOnlyCreatorCreateStatus'

export const getCompanyById = async (
  input: z.infer<typeof getCompanyByIdSchema>
) => {
  const { companyId } = input

  const company = await prisma.patch_company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      logo: true,
      count: true,
      alias: true,
      introduction: true,
      primary_language: true,
      official_website: true,
      parent_brand: true,
      created: true
    }
  })
  if (!company) {
    return '未找到公司'
  }

  return company
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getCompanyByIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getCompanyById(input)
  return NextResponse.json(response)
}

export const createCompany = async (
  input: z.infer<typeof createCompanySchema>
) => {
  const {
    name,
    primary_language,
    introduction = '',
    alias = [],
    official_website = [],
    parent_brand = []
  } = input

  const existingCompany = await prisma.patch_company.findFirst({
    where: {
      OR: [{ name }, { alias: { has: name } }]
    }
  })
  if (existingCompany) {
    return '这个会社已经存在了'
  }

  const newCompany = await prisma.patch_company.create({
    data: {
      name,
      introduction,
      alias,
      primary_language,
      official_website,
      parent_brand
    },
    select: {
      id: true,
      name: true,
      count: true,
      alias: true
    }
  })

  return newCompany
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createCompanySchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  const { enableOnlyCreatorCreate } = await getEnableOnlyCreatorCreateStatus()
  if (enableOnlyCreatorCreate && payload.role < 2) {
    return NextResponse.json('网站正在遭受攻击, 目前仅允许创作者创建和更改项目')
  }

  const response = await createCompany(input)
  return NextResponse.json(response)
}
