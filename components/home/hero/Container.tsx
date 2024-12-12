import { Button } from '@nextui-org/button'
import { KunTypedText } from './TypedText'
import { Download } from 'lucide-react'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { GitHub } from '~/components/kun/icons/GitHub'
import Link from 'next/link'

export const HeroContainer = () => {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="mb-6 text-3xl font-bold md:text-4xl">
        {kunMoyuMoe.titleShort}
      </h1>
      <div className="h-8 mb-8 text-xl md:text-2xl">
        <KunTypedText />
      </div>
      <div className="flex gap-4">
        <Button
          as={Link}
          href="/about"
          color="primary"
          variant="shadow"
          size="lg"
          startContent={<Download />}
        >
          下载方式
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
