'use client'

import { Chip, Image, Link } from '@heroui/react'
import { ROLE_LABELS } from '~/constants/character'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchCharacterDetail } from '~/types/api/character'
import { cn } from '~/utils/cn'

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

export const CharDetailContainer = ({
  char
}: {
  char: PatchCharacterDetail
}) => {
  const displayName = getPreferredLanguageText(char.name)
  const intro = getPreferredLanguageText(char.description)

  return (
    <div className="w-full my-6">
      <h1 className="text-2xl font-bold mb-4">{displayName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-default-100 border-default-200 border">
            <Image
              removeWrapper
              src={char.image || '/char.avif'}
              alt={getPreferredLanguageText(char.name)}
              className={cn(
                'w-full h-full object-cover object-[50%_top]',
                char.image ? '' : 'opacity-30!'
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {char.role && (
              <Chip size="sm" color="secondary" variant="flat">
                {ROLE_LABELS[char.role]}
              </Chip>
            )}
            {char.roles?.slice(0, 3).map((r) => (
              <Chip key={r} size="sm" variant="flat">
                {ROLE_LABELS[r]}
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

        <main className="md:col-span-3 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">介绍</h2>
            <div className="text-sm leading-7 text-default-700 whitespace-pre-line">
              {intro || '暂无介绍'}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">参与的 Galgame</h2>
            {char.patches.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {char.patches.map((p) => (
                  <div
                    key={p.id}
                    className="group rounded-2xl overflow-hidden border border-default-200"
                  >
                    <div className="aspect-video bg-default-100">
                      <Image
                        src={p.banner}
                        alt={getPreferredLanguageText(p.name)}
                        radius="none"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Link
                      size="sm"
                      href={`/patch/${p.id}`}
                      className="p-3 truncate"
                    >
                      {getPreferredLanguageText(p.name)}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-default-400">暂无参与的 Galgame</div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
