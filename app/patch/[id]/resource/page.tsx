import { ErrorComponent } from '~/components/error/ErrorComponent'
// import DOMPurify from 'isomorphic-dompurify'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Tabs, Tab } from '@nextui-org/tabs'
import { Link as NextLink } from '@nextui-org/link'
import { Calendar, Clock, Link } from 'lucide-react'
import { formatDate } from '~/utils/time'
import type { Patch } from '~/types/api/patch'

export default async function PatchResource({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (isNaN(Number(id))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }
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
          <NextLink showAnchorIcon href="/auth/forgot">
            主站论坛
          </NextLink>
        </div>

        {/* <Resources id={patch.id} /> */}
      </CardBody>
    </Card>
  )
}
