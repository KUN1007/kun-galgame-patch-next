import { Card, CardBody } from '@nextui-org/card'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import type { PatchWalkthrough } from '~/types/api/patch'

interface Props {
  walkthrough: PatchWalkthrough
}

export const WalkthroughCard = ({ walkthrough }: Props) => {
  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-start gap-4">
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

          <div></div>
        </div>
      </CardBody>
    </Card>
  )
}
