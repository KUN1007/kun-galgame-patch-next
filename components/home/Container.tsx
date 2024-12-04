import { PatchCard } from '~/components/home/PatchCard'
import { ResourceCard } from '~/components/home/ResourceCard'
import { CommentCard } from '~/components/home/CommentCard'
import type { HomeResource, HomeComment } from '~/types/api/home'

interface Props {
  galgames: GalgameCard[]
  resources: HomeResource[]
  comments: HomeComment[]
}

export const HomeContainer = ({ galgames, resources, comments }: Props) => {
  return (
    <div className="px-4 mx-auto space-y-16 max-w-7xl">
      <section>
        <h2 className="mb-6 text-2xl font-bold">最新 Galgame</h2>
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
          {galgames.map((galgame) => (
            <PatchCard key={galgame.id} patch={galgame} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">最新 Galgame 补丁</h2>
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">最新评论</h2>
        <div className="mb-8 space-y-4">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      </section>
    </div>
  )
}
