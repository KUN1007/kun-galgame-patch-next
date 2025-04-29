import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunGetPatchActions, kunGetPatchIntroductionActions } from './actions'
import { generateKunMetadataTemplate } from './metadata'
import { PatchContainer } from '~/components/patch/Container'
import type { Metadata } from 'next'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunGetPatchActions({
    patchId: Number(id)
  })
  if (typeof patch === 'string') {
    return {}
  }
  return generateKunMetadataTemplate(patch)
}

export default async function Kun({ params, children }: Props) {
  const { id } = await params

  if (isNaN(Number(id))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const patch = await kunGetPatchActions({
    patchId: Number(id)
  })
  if (typeof patch === 'string') {
    return <ErrorComponent error={patch} />
  }

  const intro = await kunGetPatchIntroductionActions({ patchId: Number(id) })
  if (typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  return <PatchContainer patch={patch} intro={intro} children={children} />
}
