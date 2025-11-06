import { Chip } from '@heroui/react'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchDetail } from '~/types/api/patch'

const localizeTitle = (detail: PatchDetail, title: string): string => {
  const titleMap: Record<string, string> = {
    'First Press Edition': '首发版',
    'Trial Edition': '体验版',
    'Download Edition': '下载版',
    'Censored Edition': '审查版',
    '18+ Patch': '18+ 补丁',
    'Incel Removal Patch': '修正版'
  }

  const parts = title.split(' - ')
  const [rawName, ...restParts] = parts

  const localizedName =
    rawName.trim() === detail.name['en-us'].trim()
      ? getPreferredLanguageText(detail.name)
      : rawName

  const localizedRest = restParts
    .map((p) => titleMap[p.trim()] ?? p.trim())
    .join(' - ')

  return localizedRest ? `${localizedName} - ${localizedRest}` : localizedName
}

export const ReleaseSection = ({ detail }: { detail: PatchDetail }) => (
  <>
    {detail.release.length > 0 && (
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">发售记录</h2>
        </div>
        <div className="space-y-6">
          {detail.release.map((r) => (
            <div key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold">
                  {localizeTitle(detail, r.title)}
                </div>
                <div className="text-sm text-default-500">{r.released}</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {r.platforms.map((p) => (
                  <Chip key={p} size="sm" color="primary" variant="flat">
                    {p}
                  </Chip>
                ))}
                {r.languages.map((l) => (
                  <Chip key={l} size="sm" color="success" variant="flat">
                    {l}
                  </Chip>
                ))}
                {r.minage > 0 && (
                  <Chip size="sm" color="warning" variant="flat">
                    {r.minage}+
                  </Chip>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    )}
  </>
)
