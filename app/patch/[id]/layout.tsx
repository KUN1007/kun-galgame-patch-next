import { PatchHeaderContainer } from '~/components/patch/header/Container'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type { Patch } from '~/types/api/patch'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunServerFetchGet<Patch>('/patch', {
    patchId: Number(id)
  })
  return generateKunMetadataTemplate(patch)
}

export default async function Kun({ params, children }: Props) {
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
    <div className="container py-6 mx-auto space-y-6">
      <PatchHeaderContainer patch={res} />
      {children}
    </div>
  )
}
