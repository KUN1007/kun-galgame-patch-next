import { PatchPullRequest } from '~/components/patch/pr/PullRequest'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { PatchPullRequest as PatchPullRequestType } from '~/types/api/patch'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchPR({ params }: Props) {
  const { id } = await params

  const pr = await kunServerFetchGet<PatchPullRequestType[]>('/patch/pr', {
    patchId: Number(id)
  })

  return <PatchPullRequest pr={pr} />
}
