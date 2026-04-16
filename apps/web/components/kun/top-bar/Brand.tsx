import { NavbarBrand } from '@heroui/navbar'
import { Tooltip } from '@heroui/tooltip'
import { Chip } from '@heroui/chip'
import { kunMoyuMoe } from '~/config/moyu-moe'
import Image from 'next/image'
import Link from 'next/link'

export const KunTopBarBrand = () => {
  return (
    <Tooltip
      disableAnimation
      showArrow
      closeDelay={0}
      placement="bottom-start"
      content={
        <div className="px-1 py-2 space-y-1">
          <div className="font-bold text-small">如何记住本站的域名?</div>
          <div className="text-tiny">{`鲲喜欢摸鱼 -> 摸鱼(moyu) . 萌(moe)`}</div>
          <div className="text-tiny">当然您也可以 Ctrl + D 收藏本站网址</div>
        </div>
      }
    >
      <NavbarBrand className="hidden grow-0 md:flex">
        <Link className="flex items-center" href="/">
          <Image
            src="/favicon.webp"
            alt={kunMoyuMoe.titleShort}
            width={50}
            height={50}
            priority
            className="rounded-2xl shrink-0"
          />
          <p className="ml-4 hidden lg:block mr-2 font-bold text-inherit">
            {kunMoyuMoe.creator.name}
          </p>
          <Chip
            className="hidden lg:flex"
            size="sm"
            variant="flat"
            color="primary"
          >
            补丁
          </Chip>
        </Link>
      </NavbarBrand>
    </Tooltip>
  )
}
