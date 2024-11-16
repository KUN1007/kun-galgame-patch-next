import { serverApi } from '~/lib/trpc-server'
import { GalgameCard } from './Card'
import {
  Card,
  CardBody,
  CardFooter,
  Image,
  Button,
  Pagination,
  Select,
  SelectItem,
  Chip
} from '@nextui-org/react'
import { Eye, Calendar, Clock } from 'lucide-react'

export const CardContainer = async () => {
  const patches = await serverApi.galgame.getGalgame.mutate({
    sort: 'created',
    page: 1,
    limit: 24
  })

  return (
    <div className="container py-8 mx-auto">
      {/* <FilterBar
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
      /> */}

      <div className="grid grid-cols-1 gap-6 mx-auto mb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {patches.map((patch) => (
          <GalgameCard key={patch.id} game={patch} />
        ))}
      </div>

      <div className="flex justify-center">
        {/* <Pagination
          total={totalPages}
          page={page}
          onChange={setPage}
          showControls
          color="primary"
          size="lg"
        /> */}
      </div>
    </div>
  )
}
