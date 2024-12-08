'use client'

import { useState } from 'react'
import { Button, Chip, Input } from '@nextui-org/react'
import { Plus } from 'lucide-react'
import { useCreatePatchStore } from '~/store/editStore'
import toast from 'react-hot-toast'

interface Props {
  errors: string | undefined
}

export const AliasInput = ({ errors }: Props) => {
  const { data, setData } = useCreatePatchStore()
  const [newAlias, setNewAlias] = useState<string>('')

  const addAlias = () => {
    const alias = newAlias.trim().toLowerCase()
    if (data.alias.includes(alias)) {
      toast.error('请不要使用重复的别名')
      return
    }
    if (newAlias.trim()) {
      setData({ ...data, alias: [...data.alias, alias] })
      setNewAlias('')
    }
  }

  const removeAlias = (index: number) => {
    setData({
      ...data,
      alias: data.alias.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          labelPlacement="outside"
          label="别名"
          placeholder="输入后点击加号添加, 建议填写游戏的日语原名以便搜索"
          value={newAlias}
          onChange={(e) => setNewAlias(e.target.value)}
          className="flex-1"
          isInvalid={!!errors}
          errorMessage={errors}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addAlias()
          }}
        />
        <Button
          color="primary"
          onClick={addAlias}
          className="self-end"
          isIconOnly
        >
          <Plus size={20} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {data.alias.map((alias, index) => (
          <Chip
            key={index}
            onClose={() => removeAlias(index)}
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
