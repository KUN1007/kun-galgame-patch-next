import { Card, CardBody } from '@heroui/card'
import { Image, Chip } from '@heroui/react'
import NextLink from 'next/link'
import type { Person } from '~/types/api/person'

export const PersonCard = ({ person }: { person: Person }) => (
  <Card className="shadow-sm overflow-hidden">
    <div className="aspect-[3/3] overflow-hidden bg-default-100">
      <Image
        src={person.image || '/person.avif'}
        alt={person.name_zh_cn || person.name_ja_jp}
        className="w-full h-full object-cover"
      />
    </div>
    <CardBody className="p-3">
      <h3 className="font-bold text-sm truncate">
        <NextLink href={`/person/${person.id}`} className="hover:underline">
          {person.name_zh_cn || person.name_ja_jp || person.name_en_us}
        </NextLink>
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {person.roles.slice(0, 3).map((r) => (
          <Chip key={r} size="sm" variant="flat">
            {r}
          </Chip>
        ))}
      </div>
    </CardBody>
  </Card>
)
