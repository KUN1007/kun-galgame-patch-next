'use client'

import { useState, useEffect, useTransition } from 'react'
import { ReleaseCard } from './ReleaseCard'
import { MonthNavigation } from './MonthNavigation'
import { KunHeader } from '~/components/kun/Header'
import { KunLoading } from '~/components/kun/Loading'
import { motion } from 'framer-motion'
import { kunFetchGet } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { KunNull } from '../kun/Null'
import { useMounted } from '~/hooks/useMounted'
import type { GalgameReleaseCard } from '~/types/api/release'
import { Link } from '@heroui/react'

interface Props {
  initialGalgames: GalgameReleaseCard[]
  initialYear: number
  initialMonth: number
}

export const ReleaseContainer = ({
  initialGalgames,
  initialYear,
  initialMonth
}: Props) => {
  const [galgames, setGalgames] =
    useState<GalgameReleaseCard[]>(initialGalgames)
  const [currentYear, setCurrentYear] = useState<number>(initialYear)
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth)
  const [isPending, startTransition] = useTransition()
  const isMounted = useMounted()

  const fetchReleaseGalgame = async () => {
    startTransition(async () => {
      const response = await kunFetchGet<KunResponse<GalgameReleaseCard[]>>(
        '/release',
        { year: currentYear, month: currentMonth }
      )
      kunErrorHandler(response, (value) => {
        setGalgames(value)
      })
    })
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchReleaseGalgame()
  }, [currentYear, currentMonth])

  const filteredGalgames = galgames.filter((game) => {
    const releaseDate = new Date(game.released)
    return (
      releaseDate.getFullYear() === currentYear &&
      releaseDate.getMonth() + 1 === currentMonth
    )
  })

  return (
    <div className="container mx-auto my-4 space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <KunHeader
          name="Galgame 新作月表"
          description="这里列举了按照月份分类的 Galgame 新作"
          endContent={
            <p className="w-full mx-auto text-default-500">
              若游戏有缺失, 您可以参照{' '}
              <Link
                showAnchorIcon
                isExternal
                href="https://vndb.org/r?f=01731;o=a;s=released"
              >
                VNDB 的新作页面
              </Link>
              , 按照列表中的游戏来{' '}
              <Link href="/edit/create">创建新 Galgame</Link>
            </p>
          }
        />
      </motion.div>

      <MonthNavigation
        currentMonth={currentMonth}
        availableMonths={Array.from({ length: 12 }, (_, i) =>
          (i + 1).toString()
        )}
        onMonthChange={setCurrentMonth}
        currentYear={currentYear}
        onYearChange={setCurrentYear}
      />

      {isPending ? (
        <KunLoading hint="正在加载 Galgame 数据" />
      ) : (
        <div className="grid grid-cols-2 gap-2 mx-auto mb-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGalgames.map((game) => (
            <ReleaseCard key={game.patchId} patch={game} />
          ))}
        </div>
      )}

      {!filteredGalgames.length && (
        <div className="flex flex-col items-center justify-center space-y-2">
          <KunNull message="该月份暂无新作发布" />
        </div>
      )}
    </div>
  )
}
