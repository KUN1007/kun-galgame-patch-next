import { router, publicProcedure } from '~/lib/trpc'
import { Prisma } from '@prisma/client'
import { prisma } from '~/prisma/index'
import { searchSchema } from '~/validations/search'

interface RawPatch {
  id: number
  name: string
  banner: string
  view: number
  type: string[]
  language: string[]
  platform: string[]
  created: Date
  favorite_by_count: bigint
  contribute_by_count: bigint
  resource_count: bigint
  comment_count: bigint
  rank: number
}

export const searchRouter = router({
  searchPatch: publicProcedure
    .input(searchSchema)
    .mutation(async ({ ctx, input }) => {
      const { query, page, limit } = input

      const offset = (page - 1) * limit

      const [rawPatches, totalCount] = await Promise.all([
        prisma.$queryRaw<RawPatch[]>`
          SELECT
            id, name, banner, view, type, language, platform, created,
            (SELECT COUNT(*) FROM "user_patch_favorite_relation" WHERE "patch_id" = patch.id) AS "favorite_by_count",
            (SELECT COUNT(*) FROM "user_patch_contribute_relation" WHERE "patch_id" = patch.id) AS "contribute_by_count",
            (SELECT COUNT(*) FROM "patch_resource" WHERE "patch_id" = patch.id) AS "resource_count",
            (SELECT COUNT(*) FROM "patch_comment" WHERE "patch_id" = patch.id) AS "comment_count",
            (0.5 * CASE WHEN name ILIKE ANY(ARRAY[${Prisma.join(query)}]) THEN 1 ELSE 0 END +
             0.3 * CASE
                     WHEN EXISTS (
                       SELECT 1
                       FROM unnest(alias) AS a
                       WHERE a ILIKE ANY(ARRAY[${Prisma.join(query)}])
                     ) THEN 1 ELSE 0 END +
             0.2 * CASE WHEN introduction ILIKE ANY(ARRAY[${Prisma.join(query)}]) THEN 1 ELSE 0 END
            ) AS rank
          FROM "patch"
          WHERE
            name ILIKE ANY(ARRAY[${Prisma.join(query)}]) OR
            EXISTS (
              SELECT 1
              FROM unnest(alias) AS a
              WHERE a ILIKE ANY(ARRAY[${Prisma.join(query)}])
            ) OR
            introduction ILIKE ANY(ARRAY[${Prisma.join(query)}])
          ORDER BY rank DESC
          LIMIT ${limit} OFFSET ${offset};
        `,
        prisma.$queryRaw<{ count: string }[]>`
          SELECT COUNT(*)
          FROM "patch"
          WHERE
            name ILIKE ANY(ARRAY[${Prisma.join(query)}]) OR
            EXISTS (
              SELECT 1
              FROM unnest(alias) AS a
              WHERE a ILIKE ANY(ARRAY[${Prisma.join(query)}])
            ) OR
            introduction ILIKE ANY(ARRAY[${Prisma.join(query)}])
        `
      ])

      const patches = rawPatches.map((patch) => ({
        id: patch.id,
        name: patch.name,
        banner: patch.banner,
        view: patch.view,
        type: patch.type,
        language: patch.language,
        platform: patch.platform,
        created: patch.created,
        _count: {
          favorite_by: Number(patch.favorite_by_count),
          contribute_by: Number(patch.contribute_by_count),
          resource: Number(patch.resource_count),
          comment: Number(patch.comment_count)
        }
      }))

      return { patches, totalCount: Number(totalCount[0].count) }
    })
})
