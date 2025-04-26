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
import { useParams, usePathname } from 'next/navigation'
import { useBreadcrumbStore } from '~/store/breadcrumb'
import { createBreadcrumbItem } from '~/constants/routes/routes'
import { dynamicRoutes } from '~/constants/routes/constants'
import type { KunBreadcrumbItem } from '~/constants/routes/constants'

export const KunNavigationBreadcrumb = () => {
  const { items, setItems } = useBreadcrumbStore()
  const pathname = usePathname()
  const params = useParams()

  const handleRoutes = async () => {
    const newItem = createBreadcrumbItem(pathname, params)
    if (!newItem) {
      return
    }

    const mergedItems = [...items, newItem]
    const itemMap = new Map<string, KunBreadcrumbItem>()

    mergedItems.forEach((item) => {
      if (itemMap.has(item.key)) {
        const existingItem = itemMap.get(item.key)
        itemMap.delete(item.key)
        if (dynamicRoutes.includes(item.key)) {
          itemMap.set(item.key, item)
        } else {
          itemMap.set(item.key, existingItem!)
        }
      } else {
        itemMap.set(item.key, item)
      }
    })

    const dedupItems = Array.from(itemMap.values())
    setItems(dedupItems)
  }

  useEffect(() => {
    handleRoutes()
  }, [pathname])

  return (
    <div className="z-10 w-full my-4">
      <div className="px-3 mx-auto max-w-7xl">
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
                    <DropdownItem
                      key={index}
                      textValue={index.toString()}
                      href={item.href}
                    >
                      <p className="break-all">{item.children}</p>
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
              classNames={{
                item: 'break-all whitespace-normal'
              }}
            >
              {item.label}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>
      </div>
    </div>
  )
}
