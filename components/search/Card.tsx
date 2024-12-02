'use client'

import { useRouter } from 'next-nprogress-bar'
import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { Chip } from '@nextui-org/chip'
import { KunCardStats } from '~/components/kun/CardStats'
import {
  SUPPORTED_TYPE_MAP,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'

interface Props {
  patch: GalgameCard
}

export const SearchCard = ({ patch }: Props) => {
  const router = useRouter()

  return (
    <Card
      className="w-full"
      isPressable
      onPress={() => router.push(`/patch/${patch.id}/introduction`)}
    >
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:w-40">
            <Image
              src={patch.banner.replace(/\.avif$/, '-mini.avif')}
              alt={patch.name}
              className="object-cover w-full h-full rounded-lg"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-semibold transition-colors hover:text-primary-500 line-clamp-2">
              {patch.name}
            </h3>

            <KunCardStats patch={patch} />

            <div className="flex flex-wrap gap-2">
              {patch.type.map((type) => (
                <Chip
                  key={type}
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="text-xs"
                >
                  {SUPPORTED_TYPE_MAP[type]}
                </Chip>
              ))}
              {patch.language.map((lang) => (
                <Chip
                  key={lang}
                  size="sm"
                  color="secondary"
                  variant="flat"
                  className="text-xs"
                >
                  {SUPPORTED_LANGUAGE_MAP[lang]}
                </Chip>
              ))}
              {patch.platform.map((platform) => (
                <Chip
                  key={platform}
                  size="sm"
                  color="success"
                  variant="flat"
                  className="text-xs"
                >
                  {SUPPORTED_PLATFORM_MAP[platform]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
