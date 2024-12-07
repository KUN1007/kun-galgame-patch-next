import { PatchPullRequest } from '~/components/patch/pr/PullRequest'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type {
  Patch,
  PatchPullRequest as PatchPullRequestType
} from '~/types/api/patch'

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunServerFetchGet<Patch>('/patch', {
    patchId: Number(id)
  })
  const pr = await kunServerFetchGet<PatchPullRequestType[]>('/patch/pr', {
    patchId: Number(id)
  })
  return generateKunMetadataTemplate(patch, pr)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const pr = await kunServerFetchGet<PatchPullRequestType[]>('/patch/pr', {
    patchId: Number(id)
  })

  return <PatchPullRequest pr={pr} />
}
