'use client'

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
  Tooltip
} from "@heroui/react"
import { useSettingStore } from '~/store/settingStore'
import { Ban, ShieldCheck, CircleSlash } from 'lucide-react'
import type { JSX } from 'react'

const themeIconMap: Record<string, JSX.Element> = {
  sfw: <ShieldCheck className="size-5" />,
  nsfw: <Ban className="size-5" />,
  all: <CircleSlash className="size-5" />
}

export const NSFWSwitcher = () => {
  const settings = useSettingStore((state) => state.data)
  const setData = useSettingStore((state) => state.setData)

  const themeIcon = themeIconMap[settings.kunNsfwEnable] || themeIconMap['all']

  return (
    <Dropdown className="min-w-0">
      <Tooltip disableAnimation showArrow closeDelay={0} content="内容显示切换">
        <div className="flex">
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              aria-label="主题切换"
              className="text-default-500"
            >
              {themeIcon}
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
            {key === 'sfw' && '仅显示 SFW (内容安全) 的内容'}
            {key === 'nsfw' && '仅显示 NSFW (可能含有 R18) 的内容'}
            {key === 'all' && '同时显示 SFW 和 NSFW 的内容'}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
