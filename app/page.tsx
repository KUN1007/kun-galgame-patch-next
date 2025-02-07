import { HomeContainer } from '~/components/home/Container'
import { getHomeData } from '~/app/api/home/route'

export const revalidate = 5

export default async function Kun() {
  const response = await getHomeData()

  return (
    <div className="container mx-auto my-4 space-y-6">
      <HomeContainer {...response} />
    </div>
  )
}
