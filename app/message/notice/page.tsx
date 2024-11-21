import { serverApi } from '~/lib/trpc-server'
import { MessageContainer } from '~/components/message/Container'

export default async function Kun() {
  const { messages, total } = await serverApi.message.getMessage.query({
    page: 1,
    limit: 30
  })

  return <MessageContainer initialMessages={messages} total={total} />
}
