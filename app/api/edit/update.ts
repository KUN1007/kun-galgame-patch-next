import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { generatePatchDiff } from './_helpers'
import { patchUpdateSchema } from '~/validations/edit'
import { createDedupMessage } from '../utils/message'
import type { PatchUpdate } from '~/types/api/patch'

export const updatePatch = async (
  input: z.infer<typeof patchUpdateSchema>,
  currentUserUid: number
) => {
  const { id, name, vndbId, alias, introduction, released } = input

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

  const lastPullRequest = await prisma.patch_pull_request.findFirst({
    where: { patch_id: id },
    orderBy: { index: 'desc' }
  })
  const newIndex = lastPullRequest ? lastPullRequest.index + 1 : 0

  const diffContent = generatePatchDiff(
    {
      name: patch.name,
      alias: patch.alias.map((a) => a.name),
      introduction: patch.introduction
    },
    input
  )

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

    if (currentUserUid === patch.user_id) {
      await prisma.patch.update({
        where: { id },
        data: {
          name,
          vndb_id: vndbId ? vndbId : null,
          introduction,
          released: released ? released : 'unknown'
        }
      })

      await prisma.patch_history.create({
        data: {
          action: 'update',
          type: 'galgame',
          content: diffContent,
          user_id: currentUserUid,
          patch_id: patch.id
        }
      })
    } else {
      const updates: PatchUpdate = {
        name: input.name,
        alias: input.alias ?? [],
        introduction: input.introduction
      }

      await prisma.patch_pull_request.create({
        data: {
          index: newIndex,
          user_id: currentUserUid,
          patch_id: id,
          diff_content: diffContent,
          content: JSON.stringify(updates)
        }
      })

      await prisma.patch_history.create({
        data: {
          action: 'create',
          type: 'pr',
          content: diffContent,
          user_id: currentUserUid,
          patch_id: patch.id
        }
      })

      await createDedupMessage({
        type: 'pr',
        sender_id: currentUserUid,
        content: '向您提出了更新请求',
        recipient_id: patch.user_id,
        link: `/patch/${patch.id}/pr`
      })
    }

    return {}
  })
}
