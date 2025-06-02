import { FC } from 'react'
import { Divider } from "@heroui/react"
// import { KunAdminLineChart } from './KunAdminLineChart'
import { KunAdminStatistic } from './KunAdminStatistic'

export const KunStats: FC = () => {
  return (
    <div className="space-y-6">
      <KunAdminStatistic />
      <Divider className="my-8" />
      {/* <KunAdminLineChart /> */}
    </div>
  )
}
