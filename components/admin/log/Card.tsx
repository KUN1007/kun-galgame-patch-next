import { Avatar } from '@nextui-org/avatar'
import { Card, CardBody } from '@nextui-org/card'
import { Chip } from '@nextui-org/chip'
import { formatDate } from '~/utils/time'
import { ADMIN_LOG_TYPE_MAP } from '~/constants/admin'
import type { AdminLog } from '~/types/api/admin'

interface Props {
  log: AdminLog
}

export const LogCard = ({ log }: Props) => {
  return (
    <Card>
      <CardBody>
        <div className="flex gap-4">
          <Avatar
            src={log.user.avatar}
            alt={log.user.name}
            className="shrink-0"
          />
          <div className="w-full">
            <pre>{log.content}</pre>

            <div className="mt-2 flex items-center gap-4">
              <span className="text-small text-default-500">
                {formatDate(log.created, {
                  isPrecise: true,
                  isShowYear: true
                })}
              </span>

              <Chip color="primary" variant="flat" size="sm">
                {ADMIN_LOG_TYPE_MAP[log.type]}
              </Chip>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
