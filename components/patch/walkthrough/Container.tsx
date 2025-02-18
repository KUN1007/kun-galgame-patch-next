'use client'

import { WalkthroughCard } from './Card'
import type { PatchWalkthrough } from '~/types/api/patch'

interface Props {
  walkthroughs: PatchWalkthrough[]
}

export const Walkthrough = ({ walkthroughs }: Props) => {
  return (
    <div className="space-y-4">
      <>
        {walkthroughs.map((walkthrough) => (
          <WalkthroughCard key={walkthrough.id} walkthrough={walkthrough} />
        ))}
      </>
    </div>
  )
}
