import { ErrorComponent } from '~/components/error/ErrorComponent'
import { UserProfile } from '~/components/user/Profile'
import { UserStats } from '~/components/user/Stats'
import { UserActivity } from '~/components/user/Activity'
import { generateKunMetadataTemplate } from './metadata'
import { kunGetUserStatusActions } from './actions'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export const generateMetadata = () => {
  return generateKunMetadataTemplate
}

export default async function Kun({ params, children }: Props) {
  const { id } = await params
  if (isNaN(Number(1))) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const user = await kunGetUserStatusActions(Number(id))
  if (!user || typeof user === 'string') {
    return <ErrorComponent error={user} />
  }

  return (
    <div className="w-full py-8 mx-auto">
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
