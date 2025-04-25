import { z } from 'zod'

export const patchCreateSchema = z.object({
  banner: z.any(),
  name: z.string().trim().min(1, { message: '游戏名称是必填项' }).max(1007),
  vndbId: z.string().max(10),
  introduction: z
    .string()
    .trim()
    .min(10, { message: '游戏介绍是必填项, 最少 10 个字符' })
    .max(100007, { message: '游戏介绍最多 100007 字' }),
  alias: z
    .string()
    .max(2333, { message: '别名字符串总长度不可超过 3000 个字符' }),
  released: z
    .string({ message: '发售日期为空, 请点击 检查重复 以从 VNDB 获取数据' })
    .max(30),
  contentLimit: z.union([z.literal('sfw'), z.literal('nsfw')])
})

export const patchUpdateSchema = z.object({
  id: z.coerce.number().min(1).max(9999999),
  name: z.string().trim().min(1, { message: '游戏名称是必填项' }).max(1007),
  vndbId: z.string().max(10),
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
        .max(500, { message: '单个别名至多 500 个字符' })
    )
    .max(30, { message: '您最多使用 30 个别名' }),
  released: z
    .string({ message: '发售日期为空, 请点击 检查重复 以从 VNDB 获取数据' })
    .max(30),
  contentLimit: z.union([z.literal('sfw'), z.literal('nsfw')])
})

export const duplicateSchema = z.object({
  vndbId: z.string().regex(/^v\d{1,6}$/, { message: 'VNDB ID 格式无效' })
})

export const imageSchema = z.object({
  image: z.any()
})

export const editLinkSchema = z.object({
  name: z.string({ message: '您的输入应为字符串' }),
  link: z
    .string({ message: '您的输入应为字符串' })
    .url({ message: '您输入的链接必须为合法 URL' })
})
