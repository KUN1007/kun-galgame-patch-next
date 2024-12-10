'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { Tooltip } from '@nextui-org/tooltip'
import {
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@nextui-org/dropdown'
import { Button } from '@nextui-org/button'
import { Moon, Sun, SunMoon } from 'lucide-react'
import { Dropdown } from '@nextui-org/dropdown'
import type { Selection } from '@nextui-org/react'

enum Theme {
  dark = 'dark',
  light = 'light',
  system = 'system'
}

enum ThemeLabel {
  dark = '深色主题',
  light = '浅色主题',
  system = '跟随系统'
}

type SelectionSet = Exclude<Selection, 'all'>

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(
    new Set([theme]) as SelectionSet
  )

  useEffect(() => {
    if (theme && !selectedTheme.has(theme)) {
      setSelectedTheme(new Set([theme]))
    }
  }, [selectedTheme, theme])

  const onSelectedThemeChange = useCallback(
    (value: Selection) => {
      const newValue = value as SelectionSet
      const currentSelectedTheme = newValue.values().next().value as Theme

      setTheme(currentSelectedTheme)
      setSelectedTheme(newValue)
    },
    [setTheme]
  )

  const themeIcon = useMemo(() => {
    if (selectedTheme.has(Theme.light)) {
      return <Sun />
    }
    if (selectedTheme.has(Theme.dark)) {
      return <Moon />
    }
    return <SunMoon />
  }, [selectedTheme])

  return (
    <Dropdown className="min-w-0">
      <Tooltip disableAnimation showArrow closeDelay={0} content="主题切换">
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
        selectedKeys={selectedTheme}
        selectionMode="single"
        onSelectionChange={onSelectedThemeChange}
      >
        <DropdownItem
          startContent={<Sun className="size-4" />}
          key={Theme.light}
        >
          {ThemeLabel.light}
        </DropdownItem>
        <DropdownItem
          startContent={<Moon className="size-4" />}
          key={Theme.dark}
        >
          {ThemeLabel.dark}
        </DropdownItem>
        <DropdownItem
          startContent={<SunMoon className="size-4" />}
          key={Theme.system}
        >
          {ThemeLabel.system}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
