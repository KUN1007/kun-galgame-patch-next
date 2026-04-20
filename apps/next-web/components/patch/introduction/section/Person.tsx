'use client'

import { ROLE_ORDER_PERSON, roleLabel } from '~/constants/character'
import { PersonCard } from '~/components/person/Card'
import type { PatchDetail } from '~/types/api/patch'

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
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
