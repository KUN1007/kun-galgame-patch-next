'use client'

import { Chip } from '@heroui/react'
import { KunHeader } from '~/components/kun/Header'
import type { CharDetail } from '~/types/api/char'

export const CharDetailContainer = ({ char }: { char: CharDetail }) => {
  return (
    <div className="w-full my-4">
      <KunHeader
        name={char.name_zh_cn || char.name_ja_jp || char.name_en_us}
        image={char.image}
        description={
          char.description_zh_cn ||
          char.description_ja_jp ||
          char.description_en_us
        }
        headerEndContent={
          <div className="flex flex-wrap gap-2">
            {char.gender && (
              <Chip
                size="sm"
                color={char.gender === 'female' ? 'danger' : 'primary'}
              >
                {char.gender}
              </Chip>
            )}
            {char.role && (
              <Chip size="sm" color="secondary" variant="flat">
                {char.role === 'protagonist'
                  ? '主角'
                  : char.role === 'main'
                    ? '主要角色'
                    : '配角'}
              </Chip>
            )}
            {char.roles?.slice(0, 3).map((r) => (
              <Chip key={r} size="sm" variant="flat">
                {r}
              </Chip>
            ))}
          </div>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {char.birthday && (
          <div className="text-sm text-default-500">生日：{char.birthday}</div>
        )}
        {!!char.age && (
          <div className="text-sm text-default-500">年龄：{char.age}</div>
        )}
        {!!char.height && (
          <div className="text-sm text-default-500">身高：{char.height} cm</div>
        )}
        {!!char.weight && (
          <div className="text-sm text-default-500">体重：{char.weight} kg</div>
        )}
        {!!char.bust && (
          <div className="text-sm text-default-500">胸围：{char.bust} cm</div>
        )}
        {!!char.waist && (
          <div className="text-sm text-default-500">腰围：{char.waist} cm</div>
        )}
        {!!char.hips && (
          <div className="text-sm text-default-500">臀围：{char.hips} cm</div>
        )}
        {!!char.cup && (
          <div className="text-sm text-default-500">罩杯：{char.cup}</div>
        )}
      </div>
    </div>
  )
}
