import { Input } from '@heroui/input'
import { KunLoading } from '~/components/kun/Loading'

interface SearchTagsProps {
  query: string
  setQuery: (value: string) => void
  searching: boolean
}

export const SearchTags = ({ query, setQuery, searching }: SearchTagsProps) => {
  return (
    <>
      <Input
        value={query}
        onValueChange={setQuery}
        placeholder="输入以自动搜索标签"
        isClearable
        variant="bordered"
        onClear={() => setQuery('')}
        isDisabled={searching}
      />
      {searching && <KunLoading hint="正在搜索标签数据..." />}
    </>
  )
}
