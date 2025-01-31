'use client'

import { useState } from 'react'
import { Button, Chip, Input } from '@nextui-org/react'
import { Plus } from 'lucide-react'

interface Props {
  aliasList: string[]
  onAddAlias: (newAlias: string) => void
  onRemoveAlias: (index: number) => void
  errors?: string
}

export const AliasManager = ({
  aliasList,
  onAddAlias,
  onRemoveAlias,
  errors
}: Props) => {
  const [newAlias, setNewAlias] = useState<string>('')

  const handleAddAlias = () => {
    onAddAlias(newAlias.trim())
    setNewAlias('')
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl">游戏别名 (可选)</h2>
      <div className="flex gap-2">
        <Input
          labelPlacement="outside"
          placeholder="输入后点击加号添加, 建议填写游戏的日语原名以便搜索"
          value={newAlias}
          onChange={(e) => setNewAlias(e.target.value)}
          className="flex-1"
          isInvalid={!!errors}
          errorMessage={errors}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAddAlias()
          }}
        />
        <Button color="primary" onPress={handleAddAlias} isIconOnly>
          <Plus size={20} />
        </Button>
      </div>

      <p className="text-sm text-default-500">
        建议填写游戏的日语原名以便搜索, 我们强烈建议您将 Galgame 的日文原名,
        写为 <b>第一个</b> 别名。
      </p>
      <p className="text-sm text-default-500">
        如果您觉得这太麻烦, 只留下游戏的日文原名也完全可以
      </p>

      <div className="flex flex-wrap gap-2 mt-2">
        {aliasList.map((alias, index) => (
          <Chip
            key={index}
            onClose={() => onRemoveAlias(index)}
            variant="flat"
            className="h-8"
          >
            {alias}
          </Chip>
        ))}
      </div>
    </div>
  )
}
