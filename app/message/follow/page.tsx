import { serverApi } from '~/lib/trpc-server'
import { MessageContainer } from '~/components/message/Container'

export default async function Kun() {
  const { messages, total } = await serverApi.message.getMessage.query({
    type: 'follow',
    page: 1,
    limit: 30
  })

  return (
    <MessageContainer initialMessages={messages} total={total} type="follow" />
  )
}
