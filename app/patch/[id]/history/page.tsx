import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { History } from '~/components/patch/history/History'
import { PatchContributor } from '~/components/patch/Contributor'
import { kunGetActions } from './actions'
import { kunGetPatchActions, kunGetContributorActions } from '../actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'

export const revalidate = 5

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunGetPatchActions({ patchId: Number(id) })
  const response = await kunGetActions({
    page: 1,
    limit: 30,
    patchId: Number(id)
  })
  if (typeof patch === 'string' || typeof response === 'string') {
    return {}
  }

  return generateKunMetadataTemplate(patch, response.histories)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const response = await kunGetActions({
    page: 1,
    limit: 30,
    patchId: Number(id)
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  const contributors = await kunGetContributorActions({ patchId: Number(id) })
  if (typeof contributors === 'string') {
    return <ErrorComponent error={contributors} />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-medium">贡献历史</h2>
        </CardHeader>
        <CardBody>
          <div className="mb-4 text-default-600">
            <p>对补丁信息, 标签, 预览图的更改将会被计入历史记录</p>
            <p>红色代表删除, 绿色代表增加</p>
          </div>

          <History
            patchId={Number(id)}
            initialHistories={response.histories}
            total={response.total}
          />
        </CardBody>
      </Card>

      <PatchContributor users={contributors} />
    </>
  )
}
