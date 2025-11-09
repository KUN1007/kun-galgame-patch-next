import { Input } from '@heroui/input'

interface Props {
  name: KunLanguage
  onChange: (newName: KunLanguage) => void
  error?: string
}

export const MultiLangNameInput = ({ name, onChange, error }: Props) => (
  <div className="space-y-2">
    <h2 className="text-xl">游戏名称</h2>
    <p className="text-sm text-default-500">写一个就可以, 不写也行, 随便你</p>
    <div className="grid sm:grid-cols-3 grid-cols-1 gap-2">
      <Input
        labelPlacement="outside"
        placeholder="日文原名"
        value={name['ja-jp']}
        onChange={(e) => onChange({ ...name, ['ja-jp']: e.target.value })}
        isInvalid={!!error}
        errorMessage={error}
      />
      <Input
        labelPlacement="outside"
        placeholder="中文名"
        value={name['zh-cn']}
        onChange={(e) => onChange({ ...name, ['zh-cn']: e.target.value })}
        isInvalid={!!error}
        errorMessage={error}
      />
      <Input
        labelPlacement="outside"
        placeholder="英文名"
        value={name['en-us']}
        onChange={(e) => onChange({ ...name, ['en-us']: e.target.value })}
        isInvalid={!!error}
        errorMessage={error}
      />
    </div>
  </div>
)
