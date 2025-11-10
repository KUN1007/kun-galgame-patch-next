import { Input } from '@heroui/input'
import { KunLoading } from '../kun/Loading'

interface Props {
  query: string
  setQuery: (value: string) => void
  searching: boolean
}

export const SearchChars = ({ query, setQuery, searching }: Props) => (
  <>
    <Input
      value={query}
      onValueChange={setQuery}
      placeholder="输入以自动搜索角色"
      isClearable
      variant="bordered"
      onClear={() => setQuery('')}
      isDisabled={searching}
    />
    {searching && <KunLoading hint="正在搜索角色数据..." />}
  </>
)
