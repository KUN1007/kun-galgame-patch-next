import { serverApi } from '~/lib/trpc-server'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { InfoContainer } from '~/components/patch/introduction/Container'
import { PatchContributor } from '~/components/patch/Contributor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PatchIntroduction({ params }: Props) {
  const { id } = await params

  const intro = await serverApi.patch.getPatchIntroduction.query({
    patchId: Number(id)
  })
  if (!intro || typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  const contributors = await serverApi.patch.getPatchContributor.query({
    patchId: Number(id)
  })

  return (
    <>
      <InfoContainer intro={intro} patchId={Number(id)} />
      <PatchContributor users={contributors} />
    </>
  )
}
