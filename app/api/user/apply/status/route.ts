import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'

export const getApplyStatus = async (uid: number) => {
  const count = await prisma.patch_resource.count({
    where: { user_id: uid }
  })
  const user = await prisma.user.findUnique({
    where: { id: uid }
  })
  const role = user?.role ?? 0

  return { count, role }
}

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)

  const response = await getApplyStatus(payload?.uid ?? 0)
  return NextResponse.json(response)
}
