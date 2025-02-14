import { NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { markdownToText } from '~/utils/markdownToText'
import { HomeComment, HomeResource } from '~/types/api/home'

export const getHomeData = async () => {
  const [galgames, resourcesData, commentsData] = await Promise.all([
    prisma.patch.findMany({
      orderBy: { created: 'desc' },
      select: {
        id: true,
        name: true,
        banner: true,
        view: true,
        download: true,
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
      take: 12
    }),
    prisma.patch_resource.findMany({
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name: true
          }
        },
        user: {
          include: {
            _count: {
              select: { patch_resource: true }
            }
          }
        },
        _count: {
          select: {
            like_by: true
          }
        }
      },
      take: 6
    }),
    prisma.patch_comment.findMany({
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
      take: 6
    })
  ])

  const resources: HomeResource[] = resourcesData.map((resource) => ({
    id: resource.id,
    storage: resource.storage,
    size: resource.size,
    type: resource.type,
    language: resource.language,
    note: resource.note.slice(0, 233),
    platform: resource.platform,
    likeCount: resource._count.like_by,
    download: resource.download,
    patchId: resource.patch_id,
    patchName: resource.patch.name,
    created: String(resource.created),
    user: {
      id: resource.user.id,
      name: resource.user.name,
      avatar: resource.user.avatar,
      patchCount: resource.user._count.patch_resource
    }
  }))

  const comments: HomeComment[] = commentsData.map((comment) => ({
    id: comment.id,
    user: comment.user,
    content: markdownToText(comment.content).slice(0, 233),
    patchName: comment.patch.name,
    patchId: comment.patch_id,
    like: comment._count.like_by,
    created: comment.created
  }))

  return { galgames, resources, comments }
}

export const GET = async () => {
  const response = await getHomeData()
  return NextResponse.json(response)
}
