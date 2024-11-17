import { Card, CardBody } from '@nextui-org/card'
import { formatDate } from '~/utils/time'
import type { UserContribute } from '~/types/api/user'

interface Props {
  contribute: UserContribute
}

export const UserContributeCard = ({ contribute }: Props) => {
  return (
    <Card className="w-full">
      <CardBody className="p-4 space-y-3">
        <h3 className="text-xl font-semibold line-clamp-2">
          {contribute.patchName}
        </h3>
        <p className="text-default-500">
          贡献于{' '}
          {formatDate(contribute.created, {
            isPrecise: true,
            isShowYear: true
          })}
        </p>
      </CardBody>
    </Card>
  )
}
