import { Button } from '@nextui-org/button'
import { KunTypedText } from './TypedText'
import { Download } from 'lucide-react'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { GitHub } from '~/components/kun/icons/GitHub'

export const HeroContainer = () => {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="mb-6 text-3xl font-bold md:text-4xl">鲲 Galgame 补丁</h1>
      <div className="h-8 mb-8 text-xl md:text-2xl">
        <KunTypedText />
      </div>
      <div className="flex gap-4">
        <Button
          as="a"
          href="/galgame"
          color="primary"
          variant="shadow"
          size="lg"
          startContent={<Download />}
        >
          开始下载
        </Button>
        <Button
          as="a"
          href="https://github.com/KUN1007/kun-galgame-patch-next"
          variant="bordered"
          size="lg"
          startContent={<GitHub />}
        >
          GitHub
        </Button>
      </div>
    </div>
  )
}
