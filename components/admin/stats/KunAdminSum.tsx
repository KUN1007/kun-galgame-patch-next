'use client'

import { FC, useEffect, useState } from 'react'
import { StatsCard } from './StatsCard'
import { kunFetchGet } from '~/utils/kunFetch'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { ADMIN_STATS_SUM_MAP } from '~/constants/admin'
import type { SumData } from '~/types/api/admin'

export const KunAdminSum: FC = () => {
  const [sum, setSum] = useState<SumData>({
    userCount: 0,
    galgameCount: 0,
    patchResourceCount: 0,
    patchCommentCount: 0
  })

  const fetchSummaryData = async () => {
    const res = await kunFetchGet<KunResponse<SumData>>('/admin/stats/sum')
    kunErrorHandler(res, setSum)
  }

  useEffect(() => {
    fetchSummaryData()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">数据统计</h2>

      <div className="flex flex-wrap gap-4">
        {Object.entries(ADMIN_STATS_SUM_MAP).map(([key, title]) => (
          <StatsCard
            key={key}
            title={title}
            value={sum[key as keyof SumData]}
          />
        ))}
      </div>
    </div>
  )
}
