import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { UserFollow } from '~/types/api/user'

const uidSchema = z.object({
  uid: z.coerce.number({ message: '请输入合法的用户 ID' }).min(1).max(9999999)
})

export const getUserFollower = async (
  uid: number,
  currentUserUid: number | undefined
) => {
  const relations = await prisma.user_follow_relation.findMany({
    where: { following_id: uid },
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
      .includes(currentUserUid ?? 0)
  }))

  return followers
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, uidSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)

  const response = await getUserFollower(input.uid, payload?.uid)
  return NextResponse.json(response)
}
