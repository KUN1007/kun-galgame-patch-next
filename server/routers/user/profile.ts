import { publicProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import { UserResource } from '~/types/api/user'

export const getUserPatchResource = publicProcedure
  .input(getUserInfoSchema)
  .query(async ({ ctx, input }) => {
    const { uid, page, limit } = input
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      await prisma.patch_resource.findMany({
        where: { user_id: uid },
        include: {
          patch: true
        },
        skip: offset,
        take: limit
      }),
      await prisma.patch_resource.count({
        where: { user_id: uid }
      })
    ])

    const resources: UserResource[] = data.map((res) => ({
      id: res.id,
      patchId: res.patch.id,
      patchName: res.patch.name,
      patchBanner: res.patch.banner,
      size: res.size,
      type: res.type,
      language: res.language,
      platform: res.platform,
      created: String(res.created)
    }))

    return { resources, total }
  })
