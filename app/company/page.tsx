import type { Metadata } from 'next'
import { Container } from '~/components/company/Container'
import { kunMetadata } from './metadata'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  return <Container initialCompanies={[]} initialTotal={0} />
}
