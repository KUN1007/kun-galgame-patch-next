import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { MessageContainer } from '~/components/message/Container'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunMetadata } from './metadata'
import type { Message } from '~/types/api/message'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const response = await kunServerFetchGet<
    KunResponse<{
      messages: Message[]
      total: number
    }>
  >('/message/all', {
    type: 'system',
    page: 1,
    limit: 30
  })

  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  const { messages, total } = response

  return (
    <MessageContainer initialMessages={messages} total={total} type="system" />
  )
}
