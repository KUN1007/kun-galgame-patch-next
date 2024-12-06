'use client'

import { Card, CardBody } from '@nextui-org/card'
import { formatDate } from '~/utils/time'
import { useRouter } from 'next-nprogress-bar'
import type { UserContribute } from '~/types/api/user'

interface Props {
  contribute: UserContribute
}

export const UserContributeCard = ({ contribute }: Props) => {
  const router = useRouter()

  return (
    <Card
      className="w-full"
      isPressable
      onPress={() => router.push(`/patch/${contribute.patchId}/history`)}
    >
      <CardBody className="p-4 space-y-3">
        <h3 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
          {contribute.patchName}
        </h3>
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
