import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { serverApi } from '~/lib/trpc-server'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { History } from '~/components/patch/history/History'
import { PatchContributor } from '~/components/patch/Contributor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchHistory({ params }: Props) {
  const { id } = await params

  const res = await serverApi.patch.getPatchHistory.query({
    patchId: Number(id)
  })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  const contributors = await serverApi.patch.getPatchContributor.query({
    patchId: Number(id)
  })

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-medium">贡献历史</h2>
        </CardHeader>
        <CardBody>
          <History histories={res} />
        </CardBody>
      </Card>

      <PatchContributor users={contributors} />
    </>
  )
}
