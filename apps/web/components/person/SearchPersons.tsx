import { Input } from '@heroui/input'
import { KunLoading } from '../kun/Loading'

export const SearchPersons = ({
  query,
  setQuery,
  searching
}: {
  query: string
  setQuery: (v: string) => void
  searching: boolean
}) => (
  <>
    <Input
      value={query}
      onValueChange={setQuery}
      placeholder="输入以自动搜索人物"
      isClearable
      variant="bordered"
      onClear={() => setQuery('')}
      isDisabled={searching}
    />
    {searching && <KunLoading hint="正在搜索角色数据..." />}
  </>
)
