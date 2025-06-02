'use client'

import { Input } from "@heroui/react"

interface Props {
  vndbId: string
  setVNDBId: (vndbId: string) => void
  errors?: string
}

export const VNDBInput = ({ vndbId, setVNDBId, errors }: Props) => {
  return (
    <div className="w-full space-y-2">
      <h2 className="text-xl">VNDB ID (可选)</h2>
      <Input
        variant="underlined"
        labelPlacement="outside"
        placeholder="请输入 VNDB ID, 例如 v19658"
        value={vndbId}
        onChange={(e) => setVNDBId(e.target.value)}
        isInvalid={!!errors}
        errorMessage={errors}
      />
      <p className="text-sm ">
        提示: VNDB ID 需要 VNDB 官网 (vndb.org)
        获取，当进入对应游戏的页面，游戏页面的 URL (形如
        https://vndb.org/v19658) 中的 v19658 就是 VNDB ID
      </p>
    </div>
  )
}
