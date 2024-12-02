import { NextRequest, NextResponse } from 'next/server'
import { kunParseFormData } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { updatePatchBannerSchema } from '~/validations/patch'
import { uploadPatchBanner } from './_upload'

export const updatePatchBanner = async (
  image: ArrayBuffer,
  patchId: number,
  uid: number
) => {
  const res = await uploadPatchBanner(image, patchId)
  if (!res) {
    return '上传图片错误, 未知错误'
  }
  if (typeof res === 'string') {
    return res
  }

  await prisma.patch_history.create({
    data: {
      action: 'update',
      type: 'banner',
      content: '',
      user_id: uid,
      patch_id: patchId
    }
  })

  return {}
}

export const POST = async (req: NextRequest) => {
  const input = await kunParseFormData(req, updatePatchBannerSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const image = await new Response(input.image)?.arrayBuffer()

  const response = await updatePatchBanner(image, input.patchId, payload.uid)
  return NextResponse.json(response)
}
