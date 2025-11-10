import { KunLoading } from '~/components/kun/Loading'
import { KunNull } from '~/components/kun/Null'
import { CharCard } from './Card'
import type { PatchCharacter } from '~/types/api/character'

export const CharList = ({
  chars,
  loading,
  searching
}: {
  chars: PatchCharacter[]
  loading: boolean
  searching: boolean
}) => {
  if (loading) {
    return <KunLoading hint="正在获取角色数据..." />
  }

  if (!chars.length && !searching) {
    return <KunNull message="未找到相关内容, 请尝试使用角色的日文原名搜索" />
  }

  return <CharCard characters={chars} />
}
