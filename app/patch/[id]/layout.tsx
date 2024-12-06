import { PatchHeaderContainer } from '~/components/patch/header/Container'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { Patch } from '~/types/api/patch'

export default async function Kun({
  params,
  children
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (isNaN(Number(id))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const res = await kunServerFetchGet<KunResponse<Patch>>('/patch', {
    patchId: Number(id)
  })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PatchHeaderContainer patch={res} />
      {children}
    </div>
  )
}
