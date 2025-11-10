'use client'

import { Chip, Image, Link } from '@heroui/react'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchPersonDetail } from '~/types/api/person'

export const PersonDetailContainer = ({
  person
}: {
  person: PatchPersonDetail
}) => {
  const displayName = getPreferredLanguageText(person.name)
  const intro = getPreferredLanguageText(person.description)

  return (
    <div className="w-full my-6">
      <h1 className="text-2xl font-bold mb-4">{displayName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="shrink-0 size-48 rounded-xl bg-default-100 overflow-hidden flex items-center justify-center">
            <Image
              src={person.image || '/person.avif'}
              alt={getPreferredLanguageText(person.name)}
              className="w-full h-full object-cover"
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

        <main className="md:col-span-5 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">介绍</h2>
            <div className="text-sm leading-7 text-default-700 whitespace-pre-line">
              {intro || '暂无介绍'}
            </div>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">参与的 Galgame</h2>
            {person.patches.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {person.patches.map((p) => (
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
