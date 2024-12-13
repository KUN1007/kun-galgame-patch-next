import { Card, CardBody } from '@nextui-org/card'
import { formatDate } from '~/utils/time'
import Link from 'next/link'
import type { UserContribute } from '~/types/api/user'

interface Props {
  contribute: UserContribute
}

export const UserContributeCard = ({ contribute }: Props) => {
  return (
    <Card
      isPressable
      as={Link}
      href={`/patch/${contribute.patchId}/history`}
      className="w-full"
    >
      <CardBody className="p-4 space-y-3">
        <h2 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
          {contribute.patchName}
        </h2>
        <p className="text-sm text-default-500">
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
