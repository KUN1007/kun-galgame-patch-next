import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
import { Search } from 'lucide-react'
import { KunLoading } from '~/components/kun/Loading'

interface SearchTagsProps {
  query: string
  setQuery: (value: string) => void
  handleSearch: () => void
  searching: boolean
}

export const SearchTags = ({
  query,
  setQuery,
  handleSearch,
  searching
}: SearchTagsProps) => {
  return (
    <>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="可以用空格分隔您的搜索关键字"
        endContent={
          <Button
            isIconOnly
            variant="light"
            aria-label="搜索 Galgame 标签"
            onPress={handleSearch}
          >
            <Search />
          </Button>
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch()
        }}
      />
      {searching && <KunLoading hint="正在搜索标签数据..." />}
    </>
  )
}
