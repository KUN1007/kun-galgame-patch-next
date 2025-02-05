import { Button } from '@nextui-org/button'
import { ChevronRight } from 'lucide-react'
import { GalgameCard } from '~/components/galgame/Card'
import { ResourceCard } from '~/components/resource/ResourceCard'
import { CommentCard } from '~/components/comment/CommentCard'
import Link from 'next/link'
import { HomeHero } from './Hero'
import type { HomeComment, HomeResource } from '~/types/api/home'

interface Props {
  galgames: GalgameCard[]
  resources: HomeResource[]
  comments: HomeComment[]
}

export const HomeContainer = ({ galgames, resources, comments }: Props) => {
  return (
    <div className="mx-auto space-y-16 max-w-7xl">
      <HomeHero />

      <section className="space-y-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">最新 Galgame</h2>
          <Button
            variant="light"
            as={Link}
            color="primary"
            endContent={<ChevronRight className="size-4" />}
            href="/galgame"
          >
            查看更多
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galgames.map((galgame) => (
            <GalgameCard key={galgame.id} patch={galgame} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">最新补丁资源下载</h2>
          <Button
            variant="light"
            as={Link}
            color="primary"
            endContent={<ChevronRight className="size-4" />}
            href="/resource"
          >
            查看更多
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} type="home" />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">最新评论</h2>
          <Button
            variant="light"
            as={Link}
            color="primary"
            endContent={<ChevronRight className="size-4" />}
            href="/comment"
          >
            查看更多
          </Button>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      </section>
    </div>
  )
}
