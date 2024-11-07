import { Profile } from '~/components/user/Profile'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { serverApi } from '~/lib/trpc-server'
import type { UserInfo } from '~/types/api/user'

export default async function User({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (isNaN(Number(1))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const res = await serverApi.user.getProfile.query({ id: Number(id) })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  return (
    <div className="w-full py-8 mx-auto">
      <Profile user={res} />
    </div>
  )
}
