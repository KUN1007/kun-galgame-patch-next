import { HomeContainer } from '~/components/home/Container'
import { getHomeData } from '~/app/api/home/route'
import { KUN_PATCH_REVALIDATE_TIME } from '~/config/revalidate'

export const revalidate = KUN_PATCH_REVALIDATE_TIME

export default async function Kun() {
  const response = await getHomeData()

  return (
    <div className="container mx-auto my-4 space-y-6">
      <HomeContainer {...response} />
    </div>
  )
}
