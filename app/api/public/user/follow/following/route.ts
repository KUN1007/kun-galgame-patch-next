import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { UserFollow } from '~/types/api/user'

const uidSchema = z.object({
  uid: z.coerce.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
})

export const getUserFollowing = async (
  uid: number,
  currentUserUid: number | undefined
) => {
  const relations = await prisma.user_follow_relation.findMany({
    where: { follower_id: uid },
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
      .includes(currentUserUid ?? 0)
  }))

  return followings
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, uidSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)

  const response = await getUserFollowing(input.uid, payload?.uid)
  return NextResponse.json(response)
}
