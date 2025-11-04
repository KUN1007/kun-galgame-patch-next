import {
  VndbVnDetail,
  vndbGetCharactersByIds,
  vndbGetStaffByIds
} from '../api/vndb'
import { appendJsonLine, normalizeJaName } from './normalize'
import type { CharMapValue, CharacterEntry, PersonEntry } from './types'

export function initCharMapFromVndb(
  vnDetail: VndbVnDetail | null
): Map<string, CharMapValue> {
  const charMap = new Map<string, CharMapValue>()
  const put = (key: string, data: CharMapValue) => {
    if (!key) return
    if (!charMap.has(key)) charMap.set(key, data)
    else {
      const prev = charMap.get(key)!
      const mergedRoles = Array.from(
        new Set([...(prev.roles || []), ...(data.roles || [])])
      )
      charMap.set(key, { ...prev, roles: mergedRoles })
    }
  }
  if (vnDetail?.va) {
    for (const va of vnDetail.va) {
      const ch = va.character
      if (ch) {
        put(`vndb-char:${ch.id}`, {
          source: 'vndb',
          kind: 'character',
          vndb_char_id: ch.id,
          name: ch.name || ch.original || '',
          nameEn: ch.name || '',
          nameJa: ch.original || '',
          imagesVndb: ch.image || null,
          roles: ['voice']
        } as CharacterEntry)
      }
      const staff = va.staff
      if (staff) {
        put(`vndb-staff:${staff.id}`, {
          source: 'vndb',
          kind: 'person',
          vndb_staff_id: staff.id,
          name: staff.name || staff.original || '',
          nameEn: staff.name || '',
          nameJa: staff.original || '',
          imagesVndb: null,
          roles: ['voice']
        } as PersonEntry)
        appendJsonLine('migration/sync/data/char.json', {
          provider: 'vndb',
          kind: 'staff',
          id: staff.id,
          name: staff.name || staff.original || '',
          data: staff
        }).catch(() => {})
      }
    }
  }
  if (vnDetail?.staff) {
    for (const s of vnDetail.staff) {
      const roles = s.role ? [String(s.role).toLowerCase()] : []
      const k = `vndb-staff:${s.id}`
      if (!charMap.has(k)) {
        charMap.set(k, {
          source: 'vndb',
          kind: 'person',
          vndb_staff_id: s.id,
          name: s.name || s.original || '',
          nameEn: s.name || '',
          nameJa: s.original || '',
          imagesVndb: null,
          roles
        } as PersonEntry)
      } else {
        const prev = charMap.get(k) as PersonEntry
        const mergedRoles = Array.from(
          new Set([...(prev.roles || []), ...roles])
        )
        charMap.set(k, { ...prev, roles: mergedRoles })
      }
      appendJsonLine('migration/sync/data/char.json', {
        provider: 'vndb',
        kind: 'staff',
        id: s.id,
        name: s.name || s.original || '',
        data: s
      }).catch(() => {})
    }
  }
  return charMap
}

export async function augmentVndbDetails(
  vnDetail: VndbVnDetail | null,
  vndbId: string,
  charMap: Map<string, CharMapValue>
) {
  const staffIds: string[] = []
  const charIds: string[] = []
  if (vnDetail?.staff)
    for (const s of vnDetail.staff) if (s?.id) staffIds.push(String(s.id))
  if (vnDetail?.va) {
    for (const va of vnDetail.va) {
      if (va?.character?.id) charIds.push(String(va.character.id))
      if (va?.staff?.id) staffIds.push(String(va.staff.id))
    }
  }
  const uniq = (arr: string[]) => Array.from(new Set(arr))
  const sids = uniq(staffIds)
  const cids = uniq(charIds)

  const [staffs, chars] = await Promise.all([
    vndbGetStaffByIds(sids),
    vndbGetCharactersByIds(cids)
  ])
  const staffMap = new Map(staffs.map((s) => [s.id, s]))
  const charDetMap = new Map(chars.map((c) => [c.id, c]))

  for (const [k, v] of charMap) {
    if (
      v.source === 'vndb' &&
      v.kind === 'person' &&
      (v as PersonEntry).vndb_staff_id
    ) {
      const st = staffMap.get((v as PersonEntry).vndb_staff_id!)
      if (st) {
        ;(v as PersonEntry).language =
          st.lang || (v as PersonEntry).language || ''
        ;(v as PersonEntry).links = (st.extlinks || [])
          .map((l) => l.url)
          .filter(Boolean)
        const aliases = new Set([...((v as PersonEntry).aliases || [])])
        if (st.aliases) {
          for (const a of st.aliases) {
            if (a?.name) aliases.add(normalizeJaName(a.name))
            if (a?.latin) aliases.add(normalizeJaName(a.latin))
          }
        }
        ;(v as PersonEntry).aliases = Array.from(aliases)
        ;(v as PersonEntry).descriptionEn =
          st.description || (v as PersonEntry).descriptionEn || ''
        const by = Number((st as any).birth_year || 0)
        const bm = Number((st as any).birth_mon || 0)
        const bd = Number((st as any).birth_day || 0)
        if (by)
          (v as PersonEntry).birthday =
            (v as PersonEntry).birthday || String(by)
        ;(v as PersonEntry).blood_type =
          (st as any).blood_type || (v as PersonEntry).blood_type || ''
      }
    }
    if (
      v.source === 'vndb' &&
      v.kind === 'character' &&
      (v as CharacterEntry).vndb_char_id
    ) {
      const ch = charDetMap.get((v as CharacterEntry).vndb_char_id!)
      if (ch) {
        const g0 = Array.isArray(ch.gender)
          ? String(ch.gender[0] || '').toLowerCase()
          : String(ch.gender || '').toLowerCase()
        ;(v as CharacterEntry).gender =
          g0 === 'm'
            ? 'male'
            : g0 === 'f'
              ? 'female'
              : g0 === 'o'
                ? 'non-binary'
                : g0 === 'a'
                  ? 'ambiguous'
                  : (v as CharacterEntry).gender || 'unknown'
        ;(v as CharacterEntry).descriptionEn =
          ch.description || (v as CharacterEntry).descriptionEn || ''
        ;(v as CharacterEntry).height = Number(ch.height || 0)
        ;(v as CharacterEntry).weight = Number(ch.weight || 0)
        ;(v as CharacterEntry).bust = Number(ch.bust || 0)
        ;(v as CharacterEntry).waist = Number(ch.waist || 0)
        ;(v as CharacterEntry).hips = Number(ch.hips || 0)
        ;(v as CharacterEntry).cup = ch.cup || (v as CharacterEntry).cup || ''
        ;(v as CharacterEntry).age = Number(ch.age || 0)
        // VN-specific role mapping
        try {
          const vr = (ch.vns || []).find((x) => x?.id === vndbId)
          if (vr?.role) {
            const r = String(vr.role)
            ;(v as CharacterEntry).role =
              r === 'main' ? 'protagonist' : r === 'primary' ? 'main' : 'side'
          }
        } catch {}
        // VNDB does not provide year for birthday; if present mm-dd
        try {
          const bd = Array.isArray((ch as any).birthday)
            ? (ch as any).birthday
            : null
          if (bd && bd.length) {
            const mon = Number(bd[0] || 0)
            const day = Number(bd[1] || 0)
            if (mon) {
              let s = String(mon).padStart(2, '0')
              if (day) s += '-' + String(day).padStart(2, '0')
              ;(v as CharacterEntry).birthday =
                (v as CharacterEntry).birthday || s
            }
          }
        } catch {}
        const al = new Set([...((v as CharacterEntry).char_aliases || [])])
        for (const a of ch.aliases || []) if (a) al.add(a)
        ;(v as CharacterEntry).char_aliases = Array.from(al)
      }
    }
  }
}
