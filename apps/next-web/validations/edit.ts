import { z } from 'zod'

export const patchCreateSchema = z.object({
  banner: z.any(),
  vndbId: z.string().max(10),
  name_zh_cn: z.string().trim().max(1007).default(''),
  name_ja_jp: z.string().trim().max(1007).default(''),
  name_en_us: z.string().trim().max(1007).default(''),
  introduction_zh_cn: z.string().trim().max(100007).default(''),
  introduction_ja_jp: z.string().trim().max(100007).default(''),
  introduction_en_us: z.string().trim().max(100007).default(''),
  alias: z.string().max(2333, { message: '别名字符串长度不能超过 3000 字' }),
  released: z
    .string({ message: '发售日期为空, 请点击 检查重复 以从 VNDB 获取数据' })
    .max(30),
  contentLimit: z.union([z.literal('sfw'), z.literal('nsfw')])
})

export const patchUpdateSchema = z.object({
  id: z.coerce.number().min(1).max(9999999),
  vndbId: z.string().max(10),
  name_zh_cn: z.string().trim().max(1007).default(''),
  name_ja_jp: z.string().trim().max(1007).default(''),
  name_en_us: z.string().trim().max(1007).default(''),
  introduction_zh_cn: z.string().trim().max(100007).default(''),
  introduction_ja_jp: z.string().trim().max(100007).default(''),
  introduction_en_us: z.string().trim().max(100007).default(''),
  alias: z
    .array(
      z
        .string()
        .trim()
        .min(1, { message: '别名不能为空' })
        .max(500, { message: '长度不能超过 500 字' })
    )
    .max(30, { message: '最多 30 个别名' }),
  released: z
    .string({ message: '必须传入, 否则请传 unknown 与 VNDB 同步' })
    .max(30),
  contentLimit: z.union([z.literal('sfw'), z.literal('nsfw')])
})

export const duplicateSchema = z.object({
  vndbId: z.string().regex(/^v\d{1,6}$/, { message: 'VNDB ID 格式不正确' })
})

export const imageSchema = z.object({
  image: z.any()
})

export const editLinkSchema = z.object({
  name: z.string({ message: '名称不能为空' }),
  link: z.url({ message: '请输入合法的 URL' }).max(1000)
})
