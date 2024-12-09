'use client'

import { useEffect } from 'react'
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@nextui-org/react'
import { BreadcrumbItem, Breadcrumbs } from '@nextui-org/breadcrumbs'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'
import { getKunPathLabel } from '~/constants/routes'
import { useBreadcrumbStore } from '~/store/breadcrumb'
import type { KunBreadcrumbItem } from '~/constants/routes'

export const KunNavigationBreadcrumb = () => {
  const { items, setItems } = useBreadcrumbStore()
  const pathname = usePathname()
  const label = getKunPathLabel(pathname)
  const router = useRouter()

  useEffect(() => {
    if (!label) {
      return
    }

    const newItem: KunBreadcrumbItem = {
      key: pathname,
      label,
      href: pathname
    }

    const mergedItems = [...items, newItem]
    const itemMap = new Map<string, KunBreadcrumbItem>()

    mergedItems.forEach((item) => {
      if (itemMap.has(item.key)) {
        const existingItem = itemMap.get(item.key)
        itemMap.delete(item.key)
        itemMap.set(item.key, existingItem!)
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
          separator={<ChevronRight className="size-4" />}
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
                    className="size-6 min-w-6"
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
