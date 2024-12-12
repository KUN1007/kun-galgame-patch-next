import { NextRequest, NextResponse } from 'next/server'
import { kunParseFormData } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { updatePatchBannerSchema } from '~/validations/patch'
import { uploadPatchBanner } from './_upload'

export const updatePatchBanner = async (
  image: ArrayBuffer,
  patchId: number,
  currentUserUid: number,
  currentUserRole: number
) => {
  const patch = await prisma.patch.findUnique({
    where: { id: patchId }
  })
  if (!patch) {
    return '这个 Galgame 不存在'
  }

  if (currentUserUid !== patch.user_id && currentUserRole < 3) {
    return '您没有权限更改 Galgame 的预览图片, 仅限 Galgame 发布者或管理员可以更改'
  }

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
      user_id: currentUserUid,
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

  const response = await updatePatchBanner(
    image,
    input.patchId,
    payload.uid,
    payload.role
  )
  return NextResponse.json(response)
}
