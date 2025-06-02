'use client'

import { Card, CardBody } from "@heroui/card"
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import DOMPurify from 'isomorphic-dompurify'
import { WalkthroughDropdown } from './WalkthroughDropdown'
import type { PatchWalkthrough } from '~/types/api/patch'
import type { SetStateAction } from 'react'

interface Props {
  walkthrough: PatchWalkthrough
  setWalkthroughs: (walkthroughs: SetStateAction<PatchWalkthrough[]>) => void
}

export const WalkthroughCard = ({ walkthrough, setWalkthroughs }: Props) => {
  return (
    <Card>
      <CardBody className="p-6">
        <div className="gap-4">
          <div className="flex items-center justify-between">
            <KunUser
              user={walkthrough.user}
              userProps={{
                name: walkthrough.user.name,
                description: `${formatDistanceToNow(walkthrough.created)} • 已发布攻略 ${walkthrough._count.patch_walkthrough} 个`,
                avatarProps: {
                  showFallback: true,
                  src: walkthrough.user.avatar,
                  name: walkthrough.user.name.charAt(0).toUpperCase()
                }
              }}
            />

            <WalkthroughDropdown
              walkthrough={walkthrough}
              setWalkthroughs={setWalkthroughs}
            />
          </div>

          <h3 className="mt-4 text-lg text-primary-500">{walkthrough.name}</h3>

          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(walkthrough.content)
            }}
            className="kun-prose max-w-none"
          />
        </div>
      </CardBody>
    </Card>
  )
}
