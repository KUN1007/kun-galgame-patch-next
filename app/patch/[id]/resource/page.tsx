import { Alert } from '@heroui/alert'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Link } from '@heroui/link'
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
      <CardBody className="space-y-4">
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
            <Link showAnchorIcon isExternal href="https://www.kungal.com">
              主站论坛
            </Link>
          </p>
          <p>
            如果您在本站有找不到的 AI 补丁资源, 可以前往友站{' '}
            <Link showAnchorIcon isExternal href="https://www.ai2.moe/">
              御爱同萌
            </Link>
          </p>
          <p className="text-danger-500">
            新功能, 我们更新了网站的通知系统, 如果您点赞了游戏资源,
            那么将会收到这个游戏下载资源的更新通知 (资源下载链接更新和备注更新)
          </p>
        </div>

        <Resources initialResources={response} id={Number(id)} />

        <Alert
          color="warning"
          variant="faded"
          title="使用补丁前请认真阅读补丁资源的备注（如果有）, 以免产生问题"
          className="shadow-medium"
        />
      </CardBody>
    </Card>
  )
}
