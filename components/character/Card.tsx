import { Card, CardBody } from '@heroui/card'
import { Image, Chip } from '@heroui/react'
import NextLink from 'next/link'
import type { Char } from '~/types/api/char'

export const CharCard = ({ char }: { char: Char }) => (
  <Card className="shadow-sm overflow-hidden">
    <div className="aspect-[3/4] overflow-hidden bg-default-100">
      <Image
        src={char.image || '/char.avif'}
        alt={char.name_zh_cn || char.name_ja_jp}
        className="w-full h-full object-cover"
      />
    </div>
    <CardBody className="p-3">
      <h3 className="font-bold text-sm truncate">
        <NextLink href={`/char/${char.id}`} className="hover:underline">
          {char.name_zh_cn || char.name_ja_jp || char.name_en_us}
        </NextLink>
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
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
        {char.roles.slice(0, 2).map((r) => (
          <Chip key={r} size="sm" variant="flat">
            {r}
          </Chip>
        ))}
      </div>
    </CardBody>
  </Card>
)
