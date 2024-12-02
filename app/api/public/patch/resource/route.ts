import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getPatchResource } from './get'

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999)
})

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)

  const response = await getPatchResource(input, payload?.uid ?? 0)
  return NextResponse.json(response)
}
