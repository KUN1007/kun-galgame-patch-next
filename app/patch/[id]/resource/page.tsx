import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Link } from '@nextui-org/link'
import { Resources } from '~/components/patch/resource/Resource'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { PatchResource } from '~/types/api/patch'

export default async function PatchResource({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const resources = await kunServerFetchGet<PatchResource[]>(
    '/patch/resource',
    { patchId: Number(id) }
  )

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">资源链接</h2>
      </CardHeader>
      <CardBody>
        <div className="text-default-700">
          <p>
            请注意, 本站是 Galgame 补丁站, 资源链接指的是 Galgame 补丁资源,
            我们仅提供 Galgame 补丁的下载
          </p>
          如果您要下载 Galgame 本体资源, 请前往{' '}
          <Link showAnchorIcon isExternal href="https://www.kungal.com/zh-cn">
            主站论坛
          </Link>
        </div>

        <Resources initialResources={resources} id={Number(id)} />
      </CardBody>
    </Card>
  )
}
