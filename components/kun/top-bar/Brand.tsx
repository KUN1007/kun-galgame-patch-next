import { NavbarBrand } from '@nextui-org/navbar'
import { Tooltip } from '@nextui-org/tooltip'
import { Chip } from '@nextui-org/chip'
import Link from 'next/link'

export const KunTopBarBrand = () => {
  return (
    <Tooltip
      disableAnimation
      showArrow
      closeDelay={0}
      placement="bottom-start"
      content={
        <div className="space-y-1 px-1 py-2">
          <div className="text-small font-bold">如何记住本站的域名?</div>
          <div className="text-tiny">{`鲲喜欢摸鱼 -> 摸鱼(moyu) . 萌(moe)`}</div>
          <div className="text-tiny">当然您也可以 Ctrl + D 收藏本站网址</div>
        </div>
      }
    >
      <NavbarBrand className="mr-16 hidden grow-0 sm:flex">
        <Link className="flex items-center" href="/">
          <img
            src="/favicon.webp"
            alt="鲲 Galgame 补丁"
            width={50}
            height={50}
          />
          <p className="ml-4 mr-2 font-bold text-inherit">ACME</p>
          <Chip size="sm" variant="flat" color="primary">
            补丁
          </Chip>
        </Link>
      </NavbarBrand>
    </Tooltip>
  )
}
