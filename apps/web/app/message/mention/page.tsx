import { MessageContainer } from '~/components/message/Container'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunMetadata } from './metadata'
import { kunGetActions } from '../actions'
import type { Metadata } from 'next'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const response = await kunGetActions({
    type: 'mention',
    page: 1,
    limit: 30
  })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <MessageContainer
      initialMessages={response.messages}
      total={response.total}
      type="mention"
    />
  )
}
