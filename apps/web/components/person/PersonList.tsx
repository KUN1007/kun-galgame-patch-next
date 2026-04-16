import { KunLoading } from '~/components/kun/Loading'
import { KunNull } from '~/components/kun/Null'
import { PersonCard } from './Card'
import type { PatchPerson } from '~/types/api/person'

interface Props {
  persons: PatchPerson[]
  loading: boolean
  searching: boolean
}

export const PersonList = ({ persons, loading, searching }: Props) => {
  if (loading) {
    return <KunLoading hint="正在获取人物数据..." />
  }

  if (!persons.length && !searching) {
    return <KunNull message="未找到相关内容, 请尝试使用人物的日文原名搜索" />
  }

  return (
    <div className="grid grid-cols-2 gap-2 mx-auto mb-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {persons.map((p) => (
        <PersonCard key={p.id} person={p} />
      ))}
    </div>
  )
}
