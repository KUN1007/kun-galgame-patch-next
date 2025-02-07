import { InfoContainer } from '~/components/patch/introduction/Container'
import { PatchContributor } from '~/components/patch/Contributor'
import {
  kunGetPatchActions,
  kunGetPatchIntroductionActions,
  kunGetContributorActions
} from '../actions'
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
  const patch = await kunGetPatchActions({ patchId: Number(id) })
  const intro = await kunGetPatchIntroductionActions({ patchId: Number(id) })
  const contributors = await kunGetContributorActions({ patchId: Number(id) })
  if (
    typeof patch === 'string' ||
    typeof intro === 'string' ||
    typeof contributors === 'string'
  ) {
    return {}
  }

  return generateKunMetadataTemplate(patch, intro, contributors)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const intro = await kunGetPatchIntroductionActions({ patchId: Number(id) })
  if (typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  const contributors = await kunGetContributorActions({ patchId: Number(id) })
  if (typeof contributors === 'string') {
    return <ErrorComponent error={contributors} />
  }

  return (
    <>
      <InfoContainer intro={intro} patchId={Number(id)} />
      <PatchContributor users={contributors} />
    </>
  )
}
