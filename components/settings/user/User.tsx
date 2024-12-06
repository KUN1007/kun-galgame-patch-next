import { KunHeader } from '~/components/kun/Header'
import { UserAvatar } from './Avatar'
import { Username } from './Username'
import { Bio } from './Bio'
import { Email } from './Email'
import { Password } from './Password'

export const UserSettings = () => {
  return (
    <div className="my-4 w-full">
      <KunHeader name="账户设置" description="您可以在此处设置您的账户信息" />

      <div className="m-auto max-w-3xl space-y-8">
        <UserAvatar />
        <Username />
        <Bio />
        <Email />
        <Password />
      </div>
    </div>
  )
}
