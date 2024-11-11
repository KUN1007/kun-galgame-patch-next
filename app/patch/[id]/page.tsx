import { PatchHeader } from '~/components/patch/Header'
import { PatchDetails } from '~/components/patch/Details'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { serverApi } from '~/lib/trpc-server'
import type { Patch } from '~/types/api/patch'

export default async function Patch({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (isNaN(Number(id))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const res = await serverApi.patch.getPatchById.query({ id: Number(id) })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  return (
    <div className="container py-8 mx-auto">
      <PatchHeader patch={res} />
      <PatchDetails patch={res} />
    </div>
  )
}
