import { ErrorComponent } from '~/components/error/ErrorComponent'
import { InfoContainer } from '~/components/patch/introduction/Container'
import { PatchContributor } from '~/components/patch/Contributor'
import { kunFetchGet } from '~/utils/kunFetch'
import type { PatchIntroduction } from '~/types/api/patch'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchIntroduction({ params }: Props) {
  const { id } = await params

  const intro = await kunFetchGet<KunResponse<PatchIntroduction>>(
    '/patch/introduction',
    { patchId: Number(id) }
  )
  if (!intro || typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  const contributors = await kunFetchGet<KunUser[]>('/patch/contributor', {
    patchId: Number(id)
  })
  return (
    <>
      <InfoContainer intro={intro} patchId={Number(id)} />
      <PatchContributor users={contributors} />
    </>
  )
}
