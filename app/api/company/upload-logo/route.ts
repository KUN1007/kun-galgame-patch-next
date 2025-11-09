import sharp from 'sharp'
import { uploadImageToS3 } from '~/lib/s3/uploadImageToS3'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseFormData } from '~/app/api/utils/parseQuery'
import { uploadLogoSchema } from '~/validations/company'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { getEnableOnlyCreatorCreateStatus } from '~/app/api/admin/setting/creator/getEnableOnlyCreatorCreateStatus'

export const uploadCompanyLogo = async (image: ArrayBuffer, id: number) => {
  const logoBuffer = await sharp(image).avif({ quality: 60 }).toBuffer()
  if (!checkBufferSize(logoBuffer, 1.007)) {
    return '图片体积过大'
  }

  const bucketName = `company/logo/${id}`
  await uploadImageToS3(`${bucketName}/logo.avif`, logoBuffer)
}

// @deprecated
export const __POST = async (req: NextRequest) => {
  const input = await kunParseFormData(req, uploadLogoSchema)
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

  const { logo, companyId } = input
  const logoArrayBuffer = await new Response(logo)?.arrayBuffer()

  const res = await uploadCompanyLogo(logoArrayBuffer, companyId)
  if (typeof res === 'string') {
    return NextResponse.json(res)
  }

  const logoLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/company/logo/${companyId}/logo.avif`
  return NextResponse.json(logoLink)
}
