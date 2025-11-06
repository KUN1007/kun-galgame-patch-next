'use client'

import { Chip, Image } from '@heroui/react'
import NextLink from 'next/link'
import type { CharDetail } from '~/types/api/char'

interface InfoboxItem {
  key: string
  value: string | InfoboxItem[] | { v?: string }
}

const renderInfobox = (raw: string) => {
  let inf: InfoboxItem[]
  try {
    inf = JSON.parse(raw)
  } catch {
    return null
  }

  if (!Array.isArray(inf) || inf.length === 0) {
    return null
  }

  const extractValue = (v: InfoboxItem['value']): string => {
    if (typeof v === 'string') return v
    if (Array.isArray(v)) {
      return (v as InfoboxItem['value'][])
        .map(extractValue)
        .filter(Boolean)
        .join('、')
    }
    if (v && typeof v === 'object' && 'v' in v) return String(v.v || '')
    return ''
  }

  const rows = inf.flatMap((item, idx) => {
    const key = (item?.key || '').trim()
    if (!key) return []

    const value = extractValue(item.value)
    if (!value) return []

    return (
      <div key={idx} className="flex text-sm text-default-600">
        <div className="w-24 shrink-0 text-default-500">{key}</div>
        <div className="flex-1">{value}</div>
      </div>
    )
  })

  if (!rows.length) return null
  return <div className="space-y-2 mt-4">{rows}</div>
}

export const CharDetailContainer = ({ char }: { char: CharDetail }) => {
  const displayName = char.name_zh_cn || char.name_ja_jp || char.name_en_us
  const intro =
    char.description_zh_cn || char.description_ja_jp || char.description_en_us

  return (
    <div className="w-full my-6">
      <h1 className="text-2xl font-bold mb-4">{displayName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="w-full aspect-[3/4] bg-default-100 rounded-lg overflow-hidden">
            <Image
              src={char.image || '/char.avif'}
              alt={displayName}
              className="w-full h-full object-cover object-[50%_top]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {char.gender && (
              <Chip
                size="sm"
                color={char.gender === 'female' ? 'danger' : 'primary'}
              >
                {char.gender}
              </Chip>
            )}
            {char.role && (
              <Chip size="sm" color="secondary" variant="flat">
                {char.role === 'protagonist'
                  ? '主角'
                  : char.role === 'main'
                    ? '主要角色'
                    : '配角'}
              </Chip>
            )}
            {char.roles?.slice(0, 3).map((r) => (
              <Chip key={r} size="sm" variant="flat">
                {r}
              </Chip>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {char.birthday && (
              <div className="text-sm text-default-500">
                生日：{char.birthday}
              </div>
            )}
            {!!char.age && (
              <div className="text-sm text-default-500">年龄：{char.age}</div>
            )}
            {!!char.height && (
              <div className="text-sm text-default-500">
                身高：{char.height} cm
              </div>
            )}
            {!!char.weight && (
              <div className="text-sm text-default-500">
                体重：{char.weight} kg
              </div>
            )}
            {!!char.bust && (
              <div className="text-sm text-default-500">
                胸围：{char.bust} cm
              </div>
            )}
            {!!char.waist && (
              <div className="text-sm text-default-500">
                腰围：{char.waist} cm
              </div>
            )}
            {!!char.hips && (
              <div className="text-sm text-default-500">
                臀围：{char.hips} cm
              </div>
            )}
            {!!char.cup && (
              <div className="text-sm text-default-500">罩杯：{char.cup}</div>
            )}
          </div>
          {char.alias?.length ? (
            <div>
              <h2 className="text-base font-semibold mb-2">别名</h2>
              <div className="flex flex-wrap gap-2">
                {char.alias.map((a, i) => (
                  <Chip key={i} variant="flat" color="secondary" size="sm">
                    {a}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <h2 className="text-base font-semibold">资料信息</h2>
            {renderInfobox(char.infobox) || (
              <div className="text-sm text-default-400 mt-2">暂无</div>
            )}
          </div>
        </aside>

        <main className="md:col-span-2 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">介绍</h2>
            <div className="text-sm leading-7 text-default-700 whitespace-pre-line">
              {intro || '暂无介绍'}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">参与的 Patch</h2>
            {char.patches.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {char.patches.map((p) => (
                  <NextLink
                    key={p.id}
                    href={`/patch/${p.id}`}
                    className="group rounded-lg overflow-hidden border border-default-200"
                  >
                    <div className="aspect-video bg-default-100">
                      <Image
                        src={p.banner}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 text-sm font-medium group-hover:underline truncate">
                      {p.name}
                    </div>
                  </NextLink>
                ))}
              </div>
            ) : (
              <div className="text-sm text-default-400">暂无参与的 Patch</div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
