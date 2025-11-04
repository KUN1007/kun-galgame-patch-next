'use client'

import { Chip, Link } from '@heroui/react'
import { KunHeader } from '~/components/kun/Header'
import type { PersonDetail } from '~/types/api/person'

export const PersonDetailContainer = ({ person }: { person: PersonDetail }) => {
  return (
    <div className="w-full my-4">
      <KunHeader
        name={person.name_zh_cn || person.name_ja_jp || person.name_en_us}
        image={person.image}
        description={
          person.description_zh_cn ||
          person.description_ja_jp ||
          person.description_en_us
        }
        headerEndContent={
          <div className="flex flex-wrap gap-2">
            {person.roles.map((r) => (
              <Chip key={r} size="sm" variant="flat">
                {r}
              </Chip>
            ))}
          </div>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
          <div className="text-sm text-default-500">配偶：{person.spouse}</div>
        )}
        {person.x && (
          <div className="text-sm text-default-500">Twitter：{person.x}</div>
        )}
      </div>

      {person.official_website && person.official_website.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">官方网站</h2>
          <div className="flex flex-wrap gap-2">
            <Link isExternal href={person.official_website} showAnchorIcon>
              {person.official_website}
            </Link>
          </div>
        </div>
      )}

      {person.blog && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">博客</h2>
          <Link isExternal href={person.blog} showAnchorIcon>
            {person.blog}
          </Link>
        </div>
      )}

      {person.alias && person.alias.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">别名</h2>
          <div className="flex flex-wrap gap-2">
            {person.alias.map((a, i) => (
              <Chip key={i} variant="flat" color="secondary">
                {a}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
