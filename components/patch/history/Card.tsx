import { Chip } from "@heroui/chip"
import { Card, CardBody } from "@heroui/card"
import { ScrollShadow } from "@heroui/scroll-shadow"
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { HighlightedText } from '~/components/patch/DiffContent'
import { HISTORY_ACTION_TYPE_MAP, HISTORY_TYPE_MAP } from '~/constants/history'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import type { PatchHistory } from '~/types/api/patch'

interface Props {
  history: PatchHistory
}

export const HistoryCard = ({ history }: Props) => {
  return (
    <Card>
      <CardBody className="p-6">
        <div className="flex items-start gap-4">
          <KunAvatar
            uid={history.user.id}
            avatarProps={{
              showFallback: true,
              name: history.user.name.charAt(0).toUpperCase(),
              src: history.user.avatar
            }}
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">
                  {HISTORY_ACTION_TYPE_MAP[history.action]}{' '}
                  {HISTORY_TYPE_MAP[history.type]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {history.user.name} • {formatDistanceToNow(history.created)}
                </p>
              </div>
            </div>

            <ScrollShadow className="max-h-64">
              <HighlightedText content={history.content} />
            </ScrollShadow>

            <div className="mt-2">
              <Chip color="primary">{history.type}</Chip>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
