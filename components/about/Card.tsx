'use client'

import { useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { Card, CardBody, CardFooter } from '@nextui-org/react'
import { Calendar, Type } from 'lucide-react'
import { Image } from '@nextui-org/image'
import { KunPostMetadata } from '~/lib/mdx/types'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'

interface Props {
  post: KunPostMetadata
}

export const KunAboutCard = ({ post }: Props) => {
  const router = useRouter()
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Card
      isPressable
      onPress={() => router.push(`/about/${post.slug}`)}
      className="w-full transition-transform duration-200 hover:scale-[1.02]"
    >
      <CardBody className="space-y-3 p-4">
        <h2 className="mb-2 text-xl font-bold">{post.title}</h2>
        <div className="relative mx-auto w-full overflow-hidden rounded-t-lg text-center">
          <div
            className={`absolute inset-0 animate-pulse bg-default-100 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            } transition-opacity duration-300`}
            style={{ aspectRatio: '16/9' }}
          />
          <Image
            alt={post.title}
            className={`size-full object-cover transition-all duration-300 ${
              imageLoaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
            src={post.banner}
            style={{ aspectRatio: '16/9' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-default-500">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <time>{formatDistanceToNow(post.date)}</time>
          </div>
          <div className="flex items-center gap-1">
            <Type size={16} />
            <span>1007 字</span>
          </div>
        </div>
      </CardBody>
      <CardFooter className="border-t border-default-200 bg-default-50 px-5 py-3">
        <span className="text-sm text-default-600">点击阅读更多 →</span>
      </CardFooter>
    </Card>
  )
}
