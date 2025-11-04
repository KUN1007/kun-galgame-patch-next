import { Input } from '@heroui/input'

export const SearchChars = ({
  query,
  setQuery,
  handleSearch,
  searching
}: {
  query: string
  setQuery: (v: string) => void
  handleSearch: () => void
  searching: boolean
}) => (
  <div className="flex items-center gap-4">
    <Input
      value={query}
      onValueChange={setQuery}
      placeholder="搜索角色（支持中/日/英名与别名）"
      isClearable
      variant="bordered"
      className="max-w-xl"
      onClear={() => setQuery('')}
      isDisabled={searching}
    />
  </div>
)
