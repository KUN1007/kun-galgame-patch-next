'use client'

import { useEffect } from 'react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button
} from '@nextui-org/react'
import { Breadcrumbs, BreadcrumbItem } from '@nextui-org/breadcrumbs'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'
import { getPathLabel } from './utils/routes'
import { useBreadcrumbStore } from '~/store/breadcrumb'
import type { BreadcrumbItemType } from './utils/routes'

export const KunNavigationBreadcrumb = () => {
  const { items, setItems } = useBreadcrumbStore()
  const pathname = usePathname()
  const label = getPathLabel(pathname)
  const router = useRouter()

  useEffect(() => {
    const newItem: BreadcrumbItemType = {
      key: pathname,
      label,
      href: pathname
    }

    const mergedItems = [...items, newItem]
    const itemMap = new Map()

    mergedItems.forEach((item) => {
      if (itemMap.has(item.key)) {
        const existingItem = itemMap.get(item.key)
        itemMap.delete(item.key)
        itemMap.set(item.key, existingItem)
      } else {
        itemMap.set(item.key, item)
      }
    })

    const dedupItems = Array.from(itemMap.values())
    setItems(dedupItems)
  }, [pathname])

  return (
    <div className="w-full my-4 bg-background/60 backdrop-blur-lg">
      <div className="px-6 mx-auto max-w-7xl">
        <Breadcrumbs
          underline="hover"
          separator={<ChevronRight className="w-4 h-4" />}
          itemClasses={{
            item: 'text-foreground/60 data-[current=true]:text-foreground'
          }}
          variant="light"
          radius="lg"
          renderEllipsis={({ items, ellipsisIcon, separator }) => (
            <div key="id" className="flex items-center">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    className="w-6 h-6 min-w-6"
                    size="sm"
                    variant="flat"
                  >
                    {ellipsisIcon}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Routes">
                  {items.map((item, index) => (
                    <DropdownItem key={index} href={item.href}>
                      {item.children}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
              {separator}
            </div>
          )}
        >
          {items.map((item, index) => (
            <BreadcrumbItem
              key={item.key}
              isCurrent={index === items.length - 1}
              href={item.href}
              onClick={(event) => event.preventDefault()}
              onPress={() => router.push(item.href)}
            >
              {item.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>
      </div>
    </div>
  )
}
