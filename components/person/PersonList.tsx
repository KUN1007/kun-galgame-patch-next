import { KunLoading } from '~/components/kun/Loading'
import { KunNull } from '~/components/kun/Null'
import { PersonCard } from './Card'
import type { Person } from '~/types/api/person'

export const PersonList = ({
  persons,
  loading,
  searching
}: {
  persons: Person[]
  loading: boolean
  searching: boolean
}) => {
  if (loading) return <KunLoading hint="加载人物中..." />
  if (!persons.length && !searching) return <KunNull message="暂无人物" />
  return (
    <div className="grid grid-cols-2 gap-2 mx-auto mb-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {persons.map((p) => (
        <PersonCard key={p.id} person={p} />
      ))}
    </div>
  )
}
