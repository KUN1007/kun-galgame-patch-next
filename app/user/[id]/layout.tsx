import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { UserProfile } from '~/components/user/Profile'
import { UserStats } from '~/components/user/Stats'
import { UserActivity } from '~/components/user/Activity'
import type { UserInfo } from '~/types/api/user'

export default async function Kun({
  params,
  children
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (isNaN(Number(1))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const user = await kunServerFetchGet<KunResponse<UserInfo>>(
    '/user/status/info',
    { id: Number(id) }
  )
  if (!user || typeof user === 'string') {
    return <ErrorComponent error={user} />
  }

  return (
    <div className="mx-auto w-full py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <UserProfile user={user} />

        <div className="space-y-6 lg:col-span-2">
          <UserStats user={user} />

          <UserActivity id={user.id} />
          {children}
        </div>
      </div>
    </div>
  )
}
