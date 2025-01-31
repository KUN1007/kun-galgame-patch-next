import { PatchPullRequest } from '~/components/patch/pr/PullRequest'
import { kunGetActions } from './actions'
import { kunGetPatchActions } from '../actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunGetPatchActions({ patchId: Number(id) })
  const response = await kunGetActions({ patchId: Number(id) })
  if (typeof patch === 'string' || typeof response === 'string') {
    return {}
  }
  return generateKunMetadataTemplate(patch, response)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const response = await kunGetActions({ patchId: Number(id) })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return <PatchPullRequest pr={response} />
}
