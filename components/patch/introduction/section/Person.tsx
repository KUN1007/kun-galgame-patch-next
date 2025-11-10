'use client'

import { Image } from '@heroui/react'
import NextLink from 'next/link'
import { ROLE_ORDER_PERSON, roleLabel } from '~/constants/character'
import type { PatchDetail } from '~/types/api/patch'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'

export const PersonSection = ({ detail }: { detail: PatchDetail }) => {
  if (!detail.person.length) return null
  const buckets = new Map<string, typeof detail.person>()
  for (const p of detail.person) {
    const roles = p.roles && p.roles.length ? p.roles : ['other']
    for (const r of roles) {
      const k = String(r).trim() || 'other'
      const arr = buckets.get(k) || []
      arr.push(p)
      buckets.set(k, arr)
    }
  }

  const order = (a: string, b: string) => {
    const ia = ROLE_ORDER_PERSON.indexOf(a)
    const ib = ROLE_ORDER_PERSON.indexOf(b)
    if (ia !== -1 || ib !== -1)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    return a.localeCompare(b)
  }

  const sections = Array.from(buckets.keys()).sort(order)

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded" />
        <h2 className="text-2xl font-bold">制作人员</h2>
      </div>

      {sections.map((role) => (
        <div key={role} className="mb-6">
          <h3 className="text-lg font-semibold mb-3">{roleLabel(role)}</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {(buckets.get(role) || []).map((p) => (
              <div key={`${role}-${p.id}`} className="flex gap-3">
                <div className="size-12 sm:size-16 rounded-xl bg-default-100 overflow-hidden flex items-center justify-center">
                  <Image
                    src={p.image || '/person.avif'}
                    alt={getPreferredLanguageText(p.name)}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h3 className="font-semibold truncate">
                    <NextLink
                      href={`/person/${p.id}`}
                      className="hover:underline"
                    >
                      {getPreferredLanguageText(p.name)}
                    </NextLink>
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {p.roles.slice(0, 3).map((r) => (
                      <span className="text-sm text-default-500" key={r}>
                        {roleLabel(r)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
