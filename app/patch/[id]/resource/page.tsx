import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Link } from '@nextui-org/link'
import { Resources } from '~/components/patch/resource/Resource'
import { generateKunMetadataTemplate } from './metadata'
import { kunGetPatchActions } from '../actions'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
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

  return generateKunMetadataTemplate(patch, response)
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
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">资源链接</h2>
      </CardHeader>
      <CardBody>
        <div className="text-default-600">
          <p>
            请注意, 本站是 Galgame 补丁站, 资源链接指的是 Galgame 补丁资源,
            我们仅提供 Galgame 补丁的下载
          </p>
          <p>
            <b>
              请注意, 本站的 Galgame 补丁下载资源均为用户自行上传,
              请自行鉴别资源安全性
            </b>
          </p>
          <p>
            如果您要下载 Galgame 本体资源, 请前往{' '}
            <Link showAnchorIcon isExternal href="https://www.kungal.com/zh-cn">
              主站论坛
            </Link>
          </p>
        </div>

        <Resources initialResources={response} id={Number(id)} />
      </CardBody>
    </Card>
  )
}
