'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@nextui-org/react'
import { ReleaseCard } from './ReleaseCard'
import { MonthNavigation } from './MonthNavigation'
import { KunHeader } from '~/components/kun/Header'
import { KunLoading } from '~/components/kun/Loading'
import { motion } from 'framer-motion'
import { kunFetchGet } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import type { GalgameReleaseCard } from '~/types/api/release'
import { KunNull } from '../kun/Null'

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
    fetchReleaseGalgame()
  }, [currentYear, currentMonth])

  const filteredGalgames = galgames.filter((game) => {
    const releaseDate = new Date(game.released)
    return (
      releaseDate.getFullYear() === currentYear &&
      releaseDate.getMonth() + 1 === currentMonth
    )
  })

  const handleMonthChange = (month: number) => {
    setCurrentMonth(month)
  }

  const handleYearChange = (year: number) => {
    setCurrentYear(year)
  }

  return (
    <div className="container mx-auto my-4 space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <KunHeader
          name="Galgame 新作月表"
          description="这里列举了按照月份分类的 Galgame 新作, 如果您发现有缺失, 您可以创建 Galgame"
        />
      </motion.div>

      <MonthNavigation
        currentMonth={currentMonth}
        availableMonths={Array.from({ length: 12 }, (_, i) =>
          (i + 1).toString()
        )}
        onMonthChange={handleMonthChange}
        currentYear={currentYear}
        onYearChange={handleYearChange}
      />

      {isPending ? (
        <KunLoading hint="正在加载 Galgame 数据" />
      ) : (
        <>
          {filteredGalgames.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mx-auto mb-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGalgames.map((game) => (
                <ReleaseCard key={game.patchId} patch={game} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <KunNull message="该月份暂无新作发布" />
              <Button
                color="primary"
                variant="flat"
                onPress={() => {
                  setCurrentMonth(1)
                  setCurrentYear(new Date().getFullYear())
                }}
              >
                查看本月最新发布
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
