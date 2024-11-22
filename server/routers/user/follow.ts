import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
import { createDedupMessage } from '~/server/utils/message'
import type { UserFollow } from '~/types/api/user'

export const getUserFollower = publicProcedure
  .input(
    z.object({
      uid: z.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const relations = await prisma.user_follow_relation.findMany({
      where: { following_id: input.uid },
      include: {
        follower: {
          include: {
            follower: true,
            following: true
          }
        }
      }
    })
    if (!relations.length) {
      return []
    }

    const followers: UserFollow[] = relations.map((r) => ({
      id: r.follower.id,
      name: r.follower.name,
      avatar: r.follower.avatar,
      bio: r.follower.bio,
      follower: r.follower.following.length,
      following: r.follower.follower.length,
      isFollow: r.follower.following
        .map((u) => u.follower_id)
        .includes(ctx.uid ?? 0)
    }))

    return followers
  })

export const getUserFollowing = publicProcedure
  .input(
    z.object({
      uid: z.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
    })
  )
  .query(async ({ ctx, input }) => {
    const relations = await prisma.user_follow_relation.findMany({
      where: { follower_id: input.uid },
      include: {
        following: {
          include: {
            follower: true,
            following: true
          }
        }
      }
    })
    if (!relations.length) {
      return []
    }

    const followings: UserFollow[] = relations.map((r) => ({
      id: r.following.id,
      name: r.following.name,
      avatar: r.following.avatar,
      bio: r.following.bio,
      follower: r.following.following.length,
      following: r.following.follower.length,
      isFollow: r.following.following
        .map((u) => u.follower_id)
        .includes(ctx.uid ?? 0)
    }))

    return followings
  })

export const followUser = privateProcedure
  .input(
    z.object({
      uid: z.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.uid === input.uid) {
      return '您不能关注自己'
    }

    return prisma.$transaction(async (prisma) => {
      await prisma.user_follow_relation.create({
        data: {
          follower_id: ctx.uid,
          following_id: input.uid
        }
      })

      await createDedupMessage({
        type: 'follow',
        content: '关注了您!',
        sender_id: ctx.uid,
        recipient_id: input.uid
      })
    })
  })

export const unfollowUser = privateProcedure
  .input(
    z.object({
      uid: z.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.uid === input.uid) {
      return '您不能取消关注自己'
    }

    await prisma.user_follow_relation.delete({
      where: {
        follower_id_following_id: {
          follower_id: ctx.uid,
          following_id: input.uid
        }
      }
    })
  })
