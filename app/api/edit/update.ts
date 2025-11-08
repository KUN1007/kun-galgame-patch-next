import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchUpdateSchema } from '~/validations/edit'

export const updatePatch = async (
  input: z.infer<typeof patchUpdateSchema>,
  currentUserUid: number,
  currentUserRole: number
) => {
  const { id, name, vndbId, alias, introduction, released, contentLimit } =
    input

  const patch = await prisma.patch.findUnique({
    where: { id },
    include: {
      alias: {
        select: {
          name: true
        }
      }
    }
  })
  if (!patch) {
    return '该 ID 下未找到对应补丁'
  }
  if (currentUserUid !== patch.user_id || currentUserRole < 2) {
    return '您没有权限更新该游戏信息'
  }

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch_alias.deleteMany({
      where: { patch_id: id }
    })
    const aliasData = alias.map((name) => ({
      name,
      patch_id: id
    }))
    await prisma.patch_alias.createMany({
      data: aliasData,
      skipDuplicates: true
    })

    await prisma.patch.update({
      where: { id },
      data: {
        name,
        vndb_id: vndbId ? vndbId : null,
        introduction,
        released: released ? released : 'unknown',
        content_limit: contentLimit
      }
    })

    return {}
  })
}
