import { z } from 'zod'

const KUN_BANNER_MAX_SIZE = 1.007 * 1024 * 1024

export const patchSchema = z.object({
  banner: z
    .any()
    .refine(
      (file: Blob | null) => file?.size! < KUN_BANNER_MAX_SIZE,
      `图片尺寸最大为 1007kb`
    )
    .refine(
      (file: Blob | null) =>
        [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/avif'
        ].includes(file?.type!),
      '我们仅支持 .jpg, .jpeg, .png, .webp, .avif 图片'
    ),
  name: z.string().trim().min(1, { message: '游戏名称是必填项' }),
  vndbId: z.string().regex(/^v\d{1,6}$/, { message: 'VNDB ID 格式无效' }),
  introduction: z
    .string()
    .trim()
    .min(10, { message: '游戏介绍是必填项, 最少 10 个字符' })
    .max(100007, { message: '游戏介绍最多 100007 字' }),
  alias: z
    .array(
      z
        .string()
        .trim()
        .min(1, { message: '单个别名至少一个字符' })
        .max(107, { message: '单个别名至多 107 个字符' })
    )
    .max(30, { message: '您最多使用 30 个别名' })
    .optional()
})
