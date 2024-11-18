import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { TagCard } from './Card'
import { KunNull } from '~/components/kun/Null'
import { KunLoading } from '~/components/kun/Loading'
import type { Tag as TagType } from '~/types/api/tag'

interface TagListProps {
  tags: TagType[]
  loading: boolean
  isMounted: boolean
  searching: boolean
}

export const TagList = ({
  tags,
  loading,
  isMounted,
  searching
}: TagListProps) => {
  if (!isMounted || loading) {
    return <KunLoading hint="正在获取标签数据..." />
  }

  if (!searching && tags.length === 0) {
    return <KunNull message="未找到相关内容, 请尝试使用游戏的日文原名搜索" />
  }

  return (
    <KunMasonryGrid columnWidth={256} gap={16}>
      {tags.map((tag) => (
        <TagCard key={tag.id} tag={tag} />
      ))}
    </KunMasonryGrid>
  )
}
