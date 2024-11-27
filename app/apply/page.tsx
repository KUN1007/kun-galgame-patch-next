import { ApplyContainer } from '~/components/apply/Container'
import { serverApi } from '~/lib/trpc-server'

export default async function Kun() {
  const count = await serverApi.app.getUserResourceCount.query()

  return <ApplyContainer count={count} />
}
