import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
import { Search } from 'lucide-react'
import { FC } from 'react'
import { KunLoading } from '~/components/kun/Loading'

interface SearchCompaniesProps {
  query: string
  setQuery: (value: string) => void
  handleSearch: () => void
  searching: boolean
}

export const SearchCompanies: FC<SearchCompaniesProps> = ({
  query,
  setQuery,
  handleSearch,
  searching
}) => {
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
            aria-label="搜索 Galgame 会社"
            onPress={handleSearch}
          >
            <Search />
          </Button>
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch()
        }}
      />
      {searching && <KunLoading hint="正在搜索会社数据..." />}
    </>
  )
}