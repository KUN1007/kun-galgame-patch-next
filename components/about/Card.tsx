'use client'

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

  return (
    <Card
      isPressable
      onPress={() => router.push(`/about/${post.slug}`)}
      className="w-full hover:scale-[1.02] transition-transform duration-200"
    >
      <CardBody className="p-4">
        <h2 className="mb-2 text-xl font-bold">{post.title}</h2>
        <div className="relative w-full sm:w-40">
          <Image
            src={post.banner}
            alt={post.title}
            className="object-cover w-full h-full rounded-lg"
            radius="lg"
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
      <CardFooter className="px-5 py-3 border-t border-default-200 bg-default-50">
        <span className="text-sm text-default-600">点击阅读更多 →</span>
      </CardFooter>
    </Card>
  )
}
