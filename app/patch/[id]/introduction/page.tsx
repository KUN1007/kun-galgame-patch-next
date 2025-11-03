import { PatchDetailIntro } from '~/components/patch/introduction/Detail'
import { kunGetPatchDetailActions } from '../actions'
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
  const detail = await kunGetPatchDetailActions({ patchId: Number(id) })
  if (typeof detail === 'string') {
    return {}
  }
  return generateKunMetadataTemplate(detail)
}

export default async function Kun({ params }: Props) {
  const { id } = await params
  const detail = await kunGetPatchDetailActions({ patchId: Number(id) })
  if (typeof detail === 'string') {
    return <ErrorComponent error={detail} />
  }
  return <PatchDetailIntro detail={detail} />
}
