'use client'

import { Chip, Image, Link } from '@heroui/react'
import NextLink from 'next/link'
import type { PersonDetail } from '~/types/api/person'

export const PersonDetailContainer = ({ person }: { person: PersonDetail }) => {
  const displayName =
    person.name_zh_cn || person.name_ja_jp || person.name_en_us
  const intro =
    person.description_zh_cn ||
    person.description_ja_jp ||
    person.description_en_us

  return (
    <div className="w-full my-6">
      <h1 className="text-2xl font-bold mb-4">{displayName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="w-full aspect-[3/4] bg-default-100 rounded-lg overflow-hidden">
            <Image
              src={person.image || '/person.avif'}
              alt={displayName}
              className="w-full h-full object-cover object-[50%_top]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {person.roles.map((r) => (
              <Chip key={r} size="sm" variant="flat">
                {r}
              </Chip>
            ))}
          </div>
          <div className="grid gap-2">
            {person.birthday && (
              <div className="text-sm text-default-500">
                生日：{person.birthday}
              </div>
            )}
            {person.birthplace && (
              <div className="text-sm text-default-500">
                出生地：{person.birthplace}
              </div>
            )}
            {person.blood_type && (
              <div className="text-sm text-default-500">
                血型：{person.blood_type}
              </div>
            )}
            {person.office && (
              <div className="text-sm text-default-500">
                事务所：{person.office}
              </div>
            )}
            {person.spouse && (
              <div className="text-sm text-default-500">
                配偶：{person.spouse}
              </div>
            )}
            {person.x && (
              <div className="text-sm text-default-500">
                Twitter：{person.x}
              </div>
            )}
            {person.official_website && person.official_website.length > 0 && (
              <div className="text-sm text-default-500 break-all">
                官网：
                <Link isExternal href={person.official_website} showAnchorIcon>
                  {person.official_website}
                </Link>
              </div>
            )}
            {person.blog && (
              <div className="text-sm text-default-500 break-all">
                博客：
                <Link isExternal href={person.blog} showAnchorIcon>
                  {person.blog}
                </Link>
              </div>
            )}
          </div>
          {person.alias?.length ? (
            <div>
              <h2 className="text-base font-semibold mb-2">别名</h2>
              <div className="flex flex-wrap gap-2">
                {person.alias.map((a, i) => (
                  <Chip key={i} variant="flat" color="secondary" size="sm">
                    {a}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
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
            {person.patches.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {person.patches.map((p) => (
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
