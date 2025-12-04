import { Chip } from '@heroui/chip'
import { Cloud, Link as LinkIcon, Database } from 'lucide-react'
import {
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP,
  SUPPORTED_TYPE_MAP,
  SUPPORTED_RESOURCE_LINK_MAP
} from '~/constants/resource'
import { cn } from '~/utils/cn'
import type { JSX } from 'react'

interface Props {
  types: string[]
  languages: string[]
  platforms: string[]
  modelName?: string
  downloadCount?: number
  storage?: string
  storageSize?: string
  className?: string
  size?: 'lg' | 'md' | 'sm'
}

const storageIcons: { [key: string]: JSX.Element } = {
  s3: <Cloud className="size-4" />,
  user: <LinkIcon className="size-4" />
}

export const KunPatchAttribute = ({
  types,
  languages,
  platforms,
  modelName = '',
  downloadCount,
  storage = '',
  storageSize = '',
  className = '',
  size = 'md'
}: Props) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {types.map((type) => (
        <Chip key={type} variant="flat" color="primary" size={size}>
          {SUPPORTED_TYPE_MAP[type]}
        </Chip>
      ))}
      {languages.map((lang) => (
        <Chip key={lang} variant="flat" color="secondary" size={size}>
          {SUPPORTED_LANGUAGE_MAP[lang]}
        </Chip>
      ))}
      {platforms.map((platform) => (
        <Chip key={platform} variant="flat" color="success" size={size}>
          {SUPPORTED_PLATFORM_MAP[platform]}
        </Chip>
      ))}
      {modelName && (
        <Chip variant="flat" color="danger" size={size}>
          {modelName}
        </Chip>
      )}
      {!!downloadCount && (
        <Chip variant="flat" color="default" size={size}>
          {`${downloadCount} 人下载`}
        </Chip>
      )}
      {storage && (
        <Chip
          color="secondary"
          variant="flat"
          startContent={storageIcons[storage]}
        >
          {SUPPORTED_RESOURCE_LINK_MAP[storage as 's3' | 'user']}
        </Chip>
      )}
      {storageSize && (
        <Chip variant="flat" startContent={<Database className="w-4 h-4" />}>
          {storageSize}
        </Chip>
      )}
    </div>
  )
}
