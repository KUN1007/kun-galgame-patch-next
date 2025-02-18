import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Link } from '@nextui-org/link'
import { Walkthrough } from '~/components/patch/walkthrough/Container'
import { generateKunMetadataTemplate } from './metadata'
import { kunGetPatchActions } from '../actions'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Metadata } from 'next'

export const revalidate = 5

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunGetPatchActions({ patchId: Number(id) })
  const response = await kunGetActions({ patchId: Number(id) })
  if (typeof patch === 'string' || typeof response === 'string') {
    return {}
  }

  return generateKunMetadataTemplate(patch, response)
}

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const response = await kunGetActions({ patchId: Number(id) })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">游戏攻略</h2>
      </CardHeader>
      <CardBody>
        <div className="text-default-600">
          <p>
            如果您找不到本游戏的攻略, 可以去
            <Link
              isExternal
              showAnchorIcon
              href="https://seiya-saiga.com/game/kouryaku.html"
            >
              誠也の部屋
            </Link>
            查看, 这是世界上最强大的日语 Galgame 攻略网站
          </p>
        </div>

        <Walkthrough walkthroughs={response} />
      </CardBody>
    </Card>
  )
}
