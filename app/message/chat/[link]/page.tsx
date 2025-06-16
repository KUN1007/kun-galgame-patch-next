import { ChatWindow } from '~/components/message/ChatWindow'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunGetActions } from './actions'

export const revalidate = 0

interface Props {
  params: Promise<{ link: string }>
}

export default async function Kun({ params }: Props) {
  const { link } = await params
  const res = await kunGetActions(link)

  if (typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  return (
    <ChatWindow
      chatroom={res.chatroom}
      initialMessages={res.initialMessages}
      currentUserId={res.currentUserId}
    />
  )
}
