import { router, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { createTagSchema } from '~/validations/tag'

export const tagRouter = router({
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
        }
      })

      return newTag
    })
})
