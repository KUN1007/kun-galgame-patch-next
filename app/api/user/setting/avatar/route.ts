import { NextRequest, NextResponse } from 'next/server'
import { kunParseFormData } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'
import { avatarSchema } from '~/validations/user'
import { uploadUserAvatar } from '../_upload'

export const updateUserAvatar = async (uid: number, avatar: ArrayBuffer) => {
  const user = await prisma.user.findUnique({
    where: { id: uid }
  })
  if (!user) {
    return '用户未找到'
  }
  if (user.daily_image_count >= 50) {
    return '您今日上传的图片已达到 50 张限额'
  }

  const res = await uploadUserAvatar(avatar, uid)
  if (typeof res === 'string') {
    return res
  }

  const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/user/avatar/user_${uid}/avatar-mini.avif`

  await prisma.user.update({
    where: { id: uid },
    data: { avatar: imageLink }
  })

  return { avatar: imageLink }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParseFormData(req, avatarSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const avatar = await new Response(input.avatar)?.arrayBuffer()

  const res = await updateUserAvatar(payload.uid, avatar)
  return NextResponse.json(res)
}
