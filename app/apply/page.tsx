import { ApplyContainer } from '~/components/apply/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { redirect } from 'next/navigation'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { count, role } = await kunServerFetchGet<{
    count: number
    role: number
  }>('/apply/status')

  if (role > 1) {
    redirect('/apply/success')
  }

  return <ApplyContainer count={count} />
}
