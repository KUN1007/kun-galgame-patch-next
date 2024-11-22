import { z } from 'zod'
import { publicProcedure, privateProcedure } from '~/lib/trpc'
import { prisma } from '~/prisma/index'
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

// export const getUserFollowing = publicProcedure
//   .input(
//     z.object({
//       uid: z.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
//     })
//   )
//   .mutation(async ({ ctx, input }) => {
//     const user = await prisma.user.findUnique({
//       where: { id: input.uid },
//       include: {
//         following: {
//           include: {
//             following: {
//               include: {
//                 follower: true,
//                 following: true
//               }
//             }
//           }
//         }
//       }
//     })
//     if (!user) {
//       return '用户未找到'
//     }

//     const followerUserUid = user.following.map(
//       (relation) => relation.following.id
//     )

//     const followers: UserFollow[] = user.following.map((f) => ({
//       id: f.following.id,
//       name: f.following.name,
//       avatar: f.following.avatar,
//       follower: f.following.follower.length,
//       following: f.following.following.length,
//       isFollow: followerUserUid.includes(ctx.uid ?? 0)
//     }))

//     return followers
//   })

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

    await prisma.user_follow_relation.create({
      data: {
        follower_id: ctx.uid,
        following_id: input.uid
      }
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
