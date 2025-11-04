import { KunLoading } from '~/components/kun/Loading'
import { KunNull } from '~/components/kun/Null'
import { CharCard } from './Card'
import type { Char } from '~/types/api/char'

export const CharList = ({
  chars,
  loading,
  searching
}: {
  chars: Char[]
  loading: boolean
  searching: boolean
}) => {
  if (loading) return <KunLoading hint="加载角色中..." />
  if (!chars.length && !searching) return <KunNull message="暂无角色" />
  return (
    <div className="grid grid-cols-2 gap-2 mx-auto mb-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {chars.map((c) => (
        <CharCard key={c.id} char={c} />
      ))}
    </div>
  )
}
