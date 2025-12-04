import Image from 'next/image'
import Link from 'next/link'
import { Chip } from '@heroui/chip'
import { KunCardStats } from '~/components/kun/CardStats'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchResourceDetail } from '~/types/api/resource'

export const PatchSummary = ({
  patch
}: {
  patch: PatchResourceDetail['patch']
}) => {
  const patchName = getPreferredLanguageText(patch.name)
  const alias = patch.alias.filter((item) => item && item !== patchName)
  const banner = patch.banner || '/kungalgame-trans.webp'

  return (
    <section className="relative overflow-hidden rounded-3xl border border-default-200 bg-gradient-to-br from-white via-default-50 to-default-100 text-default-900 shadow-lg dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-white">
      <div className="absolute inset-0">
        <Image
          src={banner}
          alt={patchName}
          fill
          className="object-cover opacity-30 dark:opacity-50"
          sizes="(max-width: 1024px) 100vw, 1280px"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent dark:from-[#030712]/80 dark:via-[#0f172a]/70 dark:to-transparent" />
      </div>

      <div className="relative z-10 grid gap-10 p-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-default-600 dark:text-white/70">
            Galgame 补丁资源下载
          </p>
          <h1 className="text-3xl font-semibold leading-snug text-default-900 dark:text-white sm:text-4xl">
            {patchName}
          </h1>
          {alias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alias.slice(0, 4).map((name) => (
                <Chip key={name} size="sm" variant="flat" color="secondary">
                  {name}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-sm text-default-600 dark:text-white/70">
            {[patch.released, ...patch.language, ...patch.platform]
              .filter(Boolean)
              .map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full border border-default-200/70 px-3 py-1 dark:border-white/30"
                >
                  {item}
                </span>
              ))}
          </div>

          <KunCardStats patch={patch} disableTooltip={false} isMobile={false} />

          <div className="flex flex-wrap gap-3 pt-2 text-sm font-medium">
            <Link
              href={`/patch/${patch.id}/introduction`}
              className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-default-900 shadow-sm transition hover:bg-white dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
            >
              查看补丁介绍
            </Link>
            <Link
              href={`/patch/${patch.id}/resource`}
              className="inline-flex items-center rounded-full bg-white/40 px-4 py-2 text-default-900 transition hover:bg-white/60 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              查看全部资源
            </Link>
          </div>
        </div>

        <div className="hidden md:block rounded-2xl bg-white/90 p-6 text-default-900 backdrop-blur-sm dark:bg-white/10 dark:text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-default-600 dark:text-white/70">
            Galgame 概览
          </p>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs uppercase text-default-500 dark:text-white/60">
                发行时间
              </dt>
              <dd className="text-lg font-semibold">
                {patch.released || '待定'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-default-500 dark:text-white/60">
                支持语言
              </dt>
              <dd className="text-base">
                {patch.language.length ? patch.language.join('、') : '暂无标注'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-default-500 dark:text-white/60">
                支持平台
              </dt>
              <dd className="text-base">
                {patch.platform.length ? patch.platform.join('、') : '暂无标注'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
