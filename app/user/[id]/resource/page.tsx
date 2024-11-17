import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { serverApi } from '~/lib/trpc-server'

export default async function UserResource({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  console.log(id)

  // const resources = await serverApi.patch.getPatchResource.query({
  //   patchId: Number(id)
  // })

  return <Card>资源</Card>
}
