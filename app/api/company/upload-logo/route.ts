import sharp from 'sharp'
import { uploadObject } from '~/app/api/utils/uploadImage'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseFormData } from '~/app/api/utils/parseQuery'
import { uploadLogoSchema } from '~/validations/company'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

const getBucketName = (id: number) => {
  return `kun-galgame-patch/company/${id}/logo`
}

const getLink = (id: number) => {
  return `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/company/${id}/logo/logo.avif`
}

export const uploadCompanyLogo = async (image: ArrayBuffer, id: number) => {
  const logo = await sharp(image).avif({ quality: 60 }).toBuffer()

  if (!checkBufferSize(logo, 1.007)) {
    return '图片体积过大'
  }

  const bucketName = getBucketName(id)
  const res = await uploadObject(logo, 'logo.avif', bucketName)

  return !!res
}

export const POST = async (req: NextRequest) => {
  const input = await kunParseFormData(req, uploadLogoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const { logo, companyId } = input
  const logoArrayBuffer = await new Response(logo)?.arrayBuffer()

  const res = await uploadCompanyLogo(logoArrayBuffer, companyId)
  if (!res) {
    return NextResponse.json('上传图片错误, 未知错误')
  }
  if (typeof res === 'string') {
    return NextResponse.json(res)
  }

  const logoLink = getLink(companyId)
  return NextResponse.json(logoLink)
}
