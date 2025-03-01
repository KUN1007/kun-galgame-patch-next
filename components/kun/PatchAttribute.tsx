import { Chip } from '@nextui-org/chip'
import {
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP,
  SUPPORTED_TYPE_MAP
} from '~/constants/resource'
import { cn } from '~/utils/cn'

interface Props {
  types: string[]
  languages: string[]
  platforms: string[]
  modelName?: string
  className?: string
  size?: 'lg' | 'md' | 'sm'
}

export const KunPatchAttribute = ({
  types,
  languages,
  platforms,
  modelName = '',
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
    </div>
  )
}
