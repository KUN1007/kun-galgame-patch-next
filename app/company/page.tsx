import { Container } from '~/components/company/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'
import type { Company } from '~/types/api/company'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { companies, total } = await kunServerFetchGet<{
    companies: Company[]
    total: number
  }>('/company/all', {
    page: 1,
    limit: 100
  })

  return <Container initialCompanies={companies} initialTotal={total} />
}
