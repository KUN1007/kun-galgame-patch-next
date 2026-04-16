import { prisma } from '~/prisma/index'
import { markdownToText } from '~/utils/markdownToText'
import type { CreateMessageType } from '~/types/api/message'

export const extractMentionUserIds = (text: string) => {
  const regex = /\[@[^\]]+\]\(\/user\/(\d+)\/resource\)/g
  return [...text.matchAll(regex)].map((match) => Number(match[1]))
}

export const createMentionMessage = async (
  patchId: number,
  patchName: string,
  senderUid: number,
  senderUsername: string,
  text: string
) => {
  const mentionedUserIds = extractMentionUserIds(text)
  if (mentionedUserIds.length) {
    const mentionMessageData: CreateMessageType[] = mentionedUserIds.map(
      (mentionUid) => {
        return {
          type: 'mention',
          content: `${senderUsername} 在 ${patchName} 的评论区 @ 了您\n(*・ω・)✄╰ひ╯ ${markdownToText(text).slice(0, 50)}`,
          sender_id: senderUid,
          recipient_id: mentionUid,
          link: `/patch/${patchId}/comment`
        }
      }
    )
    await prisma.user_message.createMany({
      data: mentionMessageData,
      skipDuplicates: true
    })
  }
}
