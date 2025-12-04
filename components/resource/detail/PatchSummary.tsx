'use client'

import Image from 'next/image'
import { Chip } from '@heroui/chip'
import { KunCardStats } from '~/components/kun/CardStats'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { Button, Link } from '@heroui/react'
import { Tags } from '~/components/patch/header/Tags'
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

      <div className="relative z-10 grid gap-10 p-3 sm:p-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <p className="text-xs hidden sm:block uppercase tracking-[0.4em] text-default-600 dark:text-white/70">
            Galgame 补丁资源下载
          </p>

          <h1>
            <Link
              className="text-2xl font-semibold leading-snug hover:text-primary sm:text-4xl"
              href={`/patch/${patch.id}/introduction`}
              color="foreground"
            >
              {patchName}
            </Link>
          </h1>

          {alias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alias.slice(0, 4).map((name) => (
                <Chip key={name} size="sm" variant="flat" color="default">
                  {name}
                </Chip>
              ))}
            </div>
          )}

          <Tags
            platform={patch.platform}
            language={patch.language}
            type={patch.type}
          />

          <KunCardStats patch={patch} disableTooltip={false} isMobile={false} />

          <div className="flex flex-wrap gap-3 pt-2 text-sm font-medium">
            <Button
              color="primary"
              variant="flat"
              href={`/patch/${patch.id}/introduction`}
              as={Link}
            >
              查看 Galgame 介绍
            </Button>
            <Button
              color="secondary"
              variant="flat"
              href={`/patch/${patch.id}/resource`}
              as={Link}
            >
              查看全部资源
            </Button>
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
