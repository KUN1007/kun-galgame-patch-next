import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Avatar, AvatarGroup } from '@nextui-org/avatar'
import { Tooltip } from '@nextui-org/tooltip'

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
            <Tooltip content={user.name}>
              <Avatar
                showFallback
                name={user.name.charAt(0).toUpperCase()}
                src={user.avatar}
              />
            </Tooltip>
          ))}
        </AvatarGroup>
      </CardBody>
    </Card>
  )
}
