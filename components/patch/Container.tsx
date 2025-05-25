import { PatchHeaderContainer } from '~/components/patch/header/Container'
import { Patch, PatchIntroduction } from '~/types/api/patch'

interface Props {
  children: React.ReactNode
  patch: Patch
  intro: PatchIntroduction
}

export const PatchContainer = ({ children, patch, intro }: Props) => {
  return (
    <div className="container py-6 mx-auto space-y-6">
      <PatchHeaderContainer patch={patch} intro={intro} />
      {children}
    </div>
  )
}
