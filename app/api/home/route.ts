import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { HomeResource, HomeComment } from '~/types/api/home'

export const getHomeData = async () => {
  const [galgames, resourcesData, commentsData] = await Promise.all([
    await prisma.patch.findMany({
      select: {
        id: true,
        name: true,
        banner: true,
        view: true,
        type: true,
        language: true,
        platform: true,
        created: true,
        _count: {
          select: {
            favorite_by: true,
            contribute_by: true,
            resource: true,
            comment: true
          }
        }
      },
      orderBy: { created: 'desc' },
      take: 6,
      skip: 1
    }),
    await prisma.patch_resource.findMany({
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      take: 6,
      skip: 1
    }),
    await prisma.patch_comment.findMany({
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            like_by: true
          }
        }
      },
      take: 6,
      skip: 1
    })
  ])

  const resources: HomeResource[] = resourcesData.map((resource) => ({
    id: resource.id,
    storage: resource.storage,
    size: resource.size,
    type: resource.type,
    language: resource.language,
    note: resource.note,
    platform: resource.platform,
    likeCount: 0,
    patchId: resource.patch_id,
    patchName: resource.patch.name,
    created: String(resource.created),
    user: resource.user
  }))

  const comments: HomeComment[] = commentsData.map((comment) => ({
    id: comment.id,
    user: comment.user,
    content: comment.content,
    patchName: comment.patch.name,
    patchId: comment.patch_id,
    like: comment._count.like_by,
    created: comment.created
  }))

  return { galgames, resources, comments }
}

export const GET = async (req: NextRequest) => {
  const response = await getHomeData()
  return NextResponse.json(response)
}
