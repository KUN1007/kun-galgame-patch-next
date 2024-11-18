import { router, publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import {
  createTagSchema,
  getTagSchema,
  getTagByIdSchema
} from '~/validations/tag'
import type { Tag, TagDetail } from '~/types/api/tag'

export const tagRouter = router({
  getTag: publicProcedure.input(getTagSchema).query(async ({ ctx, input }) => {
    const { page, limit } = input
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      await prisma.patch_tag.findMany({
        take: limit,
        skip: offset,
        orderBy: { count: 'desc' }
      }),
      await prisma.patch.count()
    ])

    const tags: Tag[] = data.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag.count,
      alias: tag.alias
    }))

    return { tags, total }
  }),

  getTagById: publicProcedure
    .input(getTagByIdSchema)
    .query(async ({ ctx, input }) => {
      const { tagId } = input

      const tag: TagDetail | null = await prisma.patch_tag.findUnique({
        where: { id: tagId },
        select: {
          id: true,
          name: true,
          count: true,
          alias: true,
          introduction: true,
          created: true
        }
      })
      if (!tag) {
        return '未找到标签'
      }

      return tag
    }),

  createTag: privateProcedure
    .input(createTagSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, introduction = '', alias = [] } = input

      const existingTag = await prisma.patch_tag.findFirst({
        where: {
          OR: [{ name }, { alias: { hasSome: alias } }]
        }
      })

      if (existingTag) {
        return '这个标签已经存在了'
      }

      const newTag = await prisma.patch_tag.create({
        data: {
          name,
          introduction,
          alias
        },
        select: {
          id: true,
          name: true,
          count: true,
          alias: true
        }
      })

      return newTag
    })
})
