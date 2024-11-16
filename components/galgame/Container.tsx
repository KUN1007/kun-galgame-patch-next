import { serverApi } from '~/lib/trpc-server'
import { GalgameCard } from './Card'
import { MasonryGrid } from './MasonryGrid'

export const CardContainer = async () => {
  const patches = await serverApi.galgame.getGalgame.mutate({
    sort: 'created',
    page: 1,
    limit: 24
  })

  return (
    <div className="container py-8 mx-auto">
      <MasonryGrid columnWidth={256} gap={24}>
        {patches.map((patch) => (
          <GalgameCard key={patch.id} patch={patch} />
        ))}
      </MasonryGrid>

      <div className="flex justify-center mt-8">
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
