import { MessageContainer } from '~/components/message/Container'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Kun() {
  // const comments = await api.message.getMessage.query({})

  return <MessageContainer />
}
