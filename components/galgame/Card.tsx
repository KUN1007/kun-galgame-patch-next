'use client'

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Chip
} from '@nextui-org/react'
import { Eye } from 'lucide-react'

interface Props {
  game: GalgameCard
}

export const GalgameCard = ({ game }: Props) => {
  return (
    <Card className="w-full mx-auto">
      <CardHeader className="p-0">
        <div className="w-full mx-auto overflow-hidden text-center rounded-lg aspect-video">
          <Image
            alt={game.name}
            className="object-cover"
            src={game.banner}
            style={{
              width: '100%',
              height: 'auto'
            }}
          />
        </div>
      </CardHeader>
      <CardBody className="px-4 py-2">
        <h3 className="text-lg font-semibold line-clamp-1">{game.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Eye className="w-4 h-4" />
          <span className="text-sm text-default-500">{game.view}</span>
        </div>
      </CardBody>
      <CardFooter className="flex-col items-start gap-2 px-4 py-2">
        <div className="flex flex-wrap gap-1">
          {game.type.map((type) => (
            <Chip key={type} size="sm" color="primary" variant="flat">
              {type}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {game.platform.map((platform) => (
            <Chip key={platform} size="sm" color="secondary" variant="flat">
              {platform}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {game.language.map((lang) => (
            <Chip key={lang} size="sm" color="success" variant="flat">
              {lang}
            </Chip>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
