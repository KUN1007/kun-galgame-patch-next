import { ErrorComponent } from '~/components/error/ErrorComponent'
import { InfoContainer } from '~/components/patch/introduction/Container'
import { PatchContributor } from '~/components/patch/Contributor'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type { Patch, PatchIntroduction } from '~/types/api/patch'

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
  const intro = await kunServerFetchGet<PatchIntroduction>(
    '/patch/introduction',
    { patchId: Number(id) }
  )
  const contributors = await kunServerFetchGet<KunUser[]>(
    '/patch/contributor',
    { patchId: Number(id) }
  )

  return generateKunMetadataTemplate(patch, intro, contributors)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const intro = await kunServerFetchGet<KunResponse<PatchIntroduction>>(
    '/patch/introduction',
    { patchId: Number(id) }
  )
  if (!intro || typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  const contributors = await kunServerFetchGet<KunUser[]>(
    '/patch/contributor',
    { patchId: Number(id) }
  )

  return (
    <>
      <InfoContainer intro={intro} patchId={Number(id)} />
      <PatchContributor users={contributors} />
    </>
  )
}
