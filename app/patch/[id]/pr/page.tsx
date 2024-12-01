import { PatchPullRequest } from '~/components/patch/pr/PullRequest'
import { kunFetchGet } from '~/utils/kunFetch'
import type { PatchPullRequest as PatchPullRequestType } from '~/types/api/patch'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchPR({ params }: Props) {
  const { id } = await params

  const pr = await kunFetchGet<PatchPullRequestType[]>('/patch/pr', {
    patchId: Number(id)
  })

  return <PatchPullRequest pr={pr} />
}
