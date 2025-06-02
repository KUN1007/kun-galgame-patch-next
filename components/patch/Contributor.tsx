import { Card, CardBody, CardHeader } from "@heroui/card"
import { AvatarGroup } from "@heroui/avatar"
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'

interface Props {
  users: KunUser[]
}

export const PatchContributor = ({ users }: Props) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">贡献者</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <p>感谢下面的朋友们为本补丁信息做出的贡献</p>
        <AvatarGroup isBordered className="pl-3">
          {users.map((user) => (
            <KunAvatar
              key={user.id}
              uid={user.id}
              avatarProps={{
                showFallback: true,
                name: user.name,
                src: user.avatar
              }}
            />
          ))}
        </AvatarGroup>
      </CardBody>
    </Card>
  )
}
