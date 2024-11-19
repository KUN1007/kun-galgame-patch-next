import { Input } from '@nextui-org/input'

interface Props {
  name: string
  onChange: (newName: string) => void
  error?: string
}

export const GameNameInput = ({ name, onChange, error }: Props) => (
  <Input
    isRequired
    className="mb-4"
    variant="underlined"
    labelPlacement="outside"
    label="游戏名称"
    placeholder="输入游戏名称, 这会作为游戏的标题"
    value={name}
    onChange={(e) => onChange(e.target.value)}
    isInvalid={!!error}
    errorMessage={error}
  />
)
