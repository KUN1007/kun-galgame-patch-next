import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Info } from './Info'
import { Tag } from './Tag'
import { PatchTagSelector } from './PatchTagSelector'
import type { PatchIntroduction } from '~/types/api/patch'

interface Props {
  intro: PatchIntroduction
  patchId: number
}

export const InfoContainer = ({ intro, patchId }: Props) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">游戏介绍</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <Info intro={intro} />

        <div className="mt-4">
          <h3 className="mb-4 text-xl font-medium">游戏制作商</h3>
        </div>

        {/* <Tag patchId={patchId} /> */}
        <PatchTagSelector patchId={patchId} />
      </CardBody>
    </Card>
  )
}
