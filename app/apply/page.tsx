import { ApplyContainer } from '~/components/apply/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import { redirect } from 'next/navigation'

export default async function Kun() {
  const { count, role } = await kunFetchGet<{
    count: number
    role: number
  }>('/apply/status')

  if (role > 1) {
    redirect('/apply/success')
  }

  return <ApplyContainer count={count} />
}
