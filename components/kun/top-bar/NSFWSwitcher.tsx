'use client'

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
  Tooltip
} from '@heroui/react'
import { useSettingStore } from '~/store/settingStore'
import { Ban, ShieldCheck, CircleSlash } from 'lucide-react'
import {
  KUN_CONTENT_LIMIT_LABEL,
  KUN_CONTENT_LIMIT_MAP
} from '~/constants/top-bar'
import type { JSX } from 'react'

const themeIconMap: Record<string, JSX.Element> = {
  sfw: <ShieldCheck className="size-5" />,
  nsfw: <Ban className="size-5" />,
  all: <CircleSlash className="size-5" />
}

export const NSFWSwitcher = () => {
  const settings = useSettingStore((state) => state.data)
  const setData = useSettingStore((state) => state.setData)

  return (
    <Dropdown placement="bottom-end" className="min-w-0">
      <Tooltip disableAnimation showArrow closeDelay={0} content="内容显示切换">
        <div className="flex">
          <DropdownTrigger>
            <Button
              variant="flat"
              aria-label="内容限制"
              className="text-default-500"
            >
              {KUN_CONTENT_LIMIT_LABEL[settings.kunNsfwEnable]}
            </Button>
          </DropdownTrigger>
        </div>
      </Tooltip>

      <DropdownMenu
        disallowEmptySelection
        selectedKeys={new Set([settings.kunNsfwEnable])}
        selectionMode="single"
        onSelectionChange={(key) => {
          setData({ kunNsfwEnable: key.anchorKey ?? 'sfw' })
          location.reload()
        }}
      >
        {['sfw', 'nsfw', 'all'].map((key) => (
          <DropdownItem
            startContent={themeIconMap[key]}
            textValue={key}
            key={key}
            className="text-default-700"
          >
            {KUN_CONTENT_LIMIT_MAP[key]}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
