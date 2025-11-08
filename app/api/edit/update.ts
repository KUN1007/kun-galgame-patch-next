import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchUpdateSchema } from '~/validations/edit'
import { syncPatchFromApis } from '~/app/api/edit/sync'

export const updatePatch = async (
  input: z.infer<typeof patchUpdateSchema>,
  currentUserUid: number,
  currentUserRole: number
) => {
  const {
    id,
    vndbId,
    alias,
    name_zh_cn,
    name_ja_jp,
    name_en_us,
    introduction_zh_cn,
    introduction_ja_jp,
    introduction_en_us,
    released,
    contentLimit
  } = input

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

  const oldVndbId = patch.vndb_id || null

  const result = await prisma.$transaction(async (tx) => {
    await tx.patch_alias.deleteMany({
      where: { patch_id: id }
    })
    const aliasData = alias.map((name) => ({
      name,
      patch_id: id
    }))
    await tx.patch_alias.createMany({
      data: aliasData,
      skipDuplicates: true
    })

    const displayName = name_en_us || name_ja_jp || name_zh_cn || ''
    await tx.patch.update({
      where: { id },
      data: {
        name: displayName,
        name_zh_cn,
        name_ja_jp,
        name_en_us,
        vndb_id: vndbId ? vndbId : null,
        introduction: introduction_zh_cn,
        introduction_zh_cn,
        introduction_ja_jp,
        introduction_en_us,
        released: released ? released : 'unknown',
        content_limit: contentLimit
      }
    })

    return {}
  })

  if ((vndbId || null) !== oldVndbId) {
    await syncPatchFromApis(id, vndbId || null)
  }

  return result
}
