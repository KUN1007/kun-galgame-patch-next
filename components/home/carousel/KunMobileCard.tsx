'use client'

import { Card, Chip, Link } from "@heroui/react"
import { aboutDirectoryLabelMap } from '~/constants/about'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import type { HomeCarouselMetadata } from './mdx'

interface Props {
  posts: HomeCarouselMetadata[]
  currentSlide: number
}

export const KunMobileCard = ({ posts, currentSlide }: Props) => {
  const post = posts[currentSlide]

  return (
    <Card className="h-full bg-transparent border-none shadow-none sm:hidden">
      <div className="relative h-1/2">
        <img
          alt={post.title}
          className="object-cover w-full h-full rounded-2xl"
          src={post.banner}
        />
      </div>
      <div className="py-3 h-1/2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-foreground/80">
              {post.authorName}
            </span>
          </div>

          {/* <RandomGalgameButton color="primary" variant="flat" size="sm">
            随机一部游戏
          </RandomGalgameButton> */}
        </div>

        <Link
          color="foreground"
          className="text-lg font-bold hover:text-primary-500 line-clamp-1"
          href={post.link}
        >
          <h1>{post.title}</h1>
        </Link>

        <p className="mb-2 text-xs text-foreground/80 line-clamp-2">
          {post.description}
        </p>
        <div className="flex flex-wrap gap-1">
          <Chip variant="flat" size="sm" color="primary">
            {aboutDirectoryLabelMap[post.directory]}
          </Chip>
          <Chip variant="flat" size="sm">
            {formatDistanceToNow(post.date)}
          </Chip>
        </div>
      </div>
    </Card>
  )
}
