import { ApplyContainer } from '~/components/apply/Container'
import { serverApi } from '~/lib/trpc-server'
import { redirect } from 'next/navigation'

export default async function Kun() {
  const { count, role } = await serverApi.app.getApplyStatus.query()

  if (role > 1) {
    redirect('/apply/success')
  }

  return <ApplyContainer count={count} />
}
