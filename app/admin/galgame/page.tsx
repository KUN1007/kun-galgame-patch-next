import { Galgame } from '~/components/admin/galgame/Container'
import { kunMetadata } from './metadata'
import { kunGetActions } from './actions'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const response = await kunGetActions({
    page: 1,
    limit: 30
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return <Galgame initialGalgames={response.galgames} total={response.total} />
}
