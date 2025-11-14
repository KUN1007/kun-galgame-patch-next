import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import { markdownToText } from '~/utils/markdownToText'
import type { AdminComment } from '~/types/api/admin'

export const getComment = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit, search } = input
  const offset = (page - 1) * limit

  const where = search
    ? {
        content: {
          contains: search,
          mode: 'insensitive' as const
        }
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.patch_comment.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name_en_us: true,
            name_ja_jp: true,
            name_zh_cn: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            like_by: true
          }
        }
      }
    }),
    prisma.patch_comment.count({ where })
  ])

  const comments: AdminComment[] = data.map((comment) => ({
    id: comment.id,
    user: comment.user,
    content: markdownToText(comment.content).slice(0, 233),
    patchName: {
      'en-us': comment.patch.name_en_us,
      'ja-jp': comment.patch.name_ja_jp,
      'zh-cn': comment.patch.name_zh_cn
    },
    patchId: comment.patch_id,
    like: comment._count.like_by,
    created: comment.created
  }))

  return { comments, total }
}
