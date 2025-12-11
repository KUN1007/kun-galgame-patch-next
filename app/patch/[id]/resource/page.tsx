import { Link } from '@heroui/link'
import { Resources } from '~/components/patch/resource/Resource'
import { generateKunMetadataTemplate } from './metadata'
import { kunGetPatchActions } from '../actions'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { Image } from '@heroui/image'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const revalidate = 5

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunGetPatchActions({ patchId: Number(id) })
  const response = await kunGetActions({ patchId: Number(id) })
  if (typeof patch === 'string' || typeof response === 'string') {
    return {}
  }

  return generateKunMetadataTemplate(patch, response.response)
}

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const response = await kunGetActions({ patchId: Number(id) })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded" />
        <h2 className="text-2xl font-bold text-gray-900">资源链接</h2>
      </div>

      <div className="space-y-4">
        <div className="text-default-600 space-y-2">
          <p>
            <b>
              请注意, 本站的 Galgame 补丁下载资源均为用户自行上传,
              请自行鉴别资源安全性
            </b>
          </p>
          <p>
            如果您要下载 Galgame 本体资源, 请前往{' '}
            <Link showAnchorIcon isExternal href="https://www.kungal.com">
              主站论坛
            </Link>
            , 有找不到的 AI 补丁资源, 可以前往友站{' '}
            <Link showAnchorIcon isExternal href="https://www.ai2.moe/">
              御爱同萌
            </Link>
          </p>
        </div>

        {(!response.payload || response.payload.role < 2) && (
          <Link target="_blank" href={kunMoyuMoe.ad[0].url}>
            <Image
              className="pointer-events-none select-none"
              src="/a/moyumoe1.avif"
              alt=""
            />
          </Link>
        )}

        <Resources initialResources={response.response} id={Number(id)} />
      </div>
    </div>
  )
}
