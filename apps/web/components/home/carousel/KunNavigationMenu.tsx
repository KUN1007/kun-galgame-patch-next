'use client'

import { kunMoyuMoe } from '~/config/moyu-moe'
import { Button, Link, Tooltip } from '@heroui/react'
import {
  CircleHelp,
  MessageSquare,
  Server,
  Link as LinkIcon
} from 'lucide-react'
import { Telegram } from '~/components/kun/icons/Telegram'

const menuItems = [
  { href: '/about', label: '网站帮助', icon: CircleHelp },
  { href: '/friend-link', label: '友情链接', icon: LinkIcon },
  { href: kunMoyuMoe.domain.kungal, label: '论坛', icon: MessageSquare },
  {
    href: kunMoyuMoe.domain.telegram_group,
    label: 'Telegram 群组',
    icon: Telegram
  },
  {
    href: kunMoyuMoe.domain.cluster,
    label: '鲲 Galgame 网站集群',
    icon: Server
  }
]

export const KunNavigationMenu = () => {
  return (
    <div className="absolute inset-0 flex top-4 items-start justify-center gap-4 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
      {menuItems.map(({ href, label, icon: Icon }) => (
        <Tooltip key={label} content={label}>
          <Link isExternal href={href}>
            <Button
              isIconOnly
              color="default"
              variant="solid"
              className="transition-transform bg-background/80 backdrop-blur-md hover:scale-110"
              aria-label={label}
            >
              <Icon className="w-5 h-5" />
            </Button>
          </Link>
        </Tooltip>
      ))}
    </div>
  )
}
