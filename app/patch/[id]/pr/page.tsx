import { serverApi } from '~/lib/trpc-server'
import { PatchPullRequest } from '~/components/patch/pr/PullRequest'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchPR({ params }: Props) {
  const { id } = await params

  const pr = await serverApi.patch.getPullRequest.query({
    patchId: Number(id)
  })

  return <PatchPullRequest pr={pr} />
}
